import { query as q } from 'faunadb';

import { fauna } from '../../../services/fauna';
import { stripe } from '../../../services/stripe';

export async function saveSubscription(
  subscriptionId: string,
  customerId: string,
  createAction = false
) {
  // buscar o usuário no banco do FaunaDB com o ID {customerID}
  const userRef = await fauna.query(
    q.Select(
      'ref',
      q.Get(
        q.Match(
          // Index = ao customerId
          q.Index('user_by_stripe_customer_id'),
          customerId
        )
      )
    )
  );

  // .retrieve significa qeu quer bucar apenas uma.
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const subscriptionData = {
    id: subscription.id,
    userId: userRef,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id
  };

  if (createAction) {
    // Criar os dados da subscription do usuário no faunaDB
    await fauna.query(
      // Salvar, dentro da collection subscription os dados.
      q.Create(q.Collection('subscriptions'), { data: subscriptionData })
    );
  } else {
    await fauna.query(
      q.Replace(
        // Primeiro parâmetro do Replace é selecionar os dados que devem sofrer alteração
        q.Select(
          'ref',
          q.Get(q.Match(q.Index('subscription_by_id'), subscriptionId))
        ),
        // Segundo parâmetro, os dados que vão ser colocados no lugar
        { data: subscriptionData }
      )
    );
  }
}
