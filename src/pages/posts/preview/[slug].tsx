import { GetStaticPaths, GetStaticProps } from 'next';
import { useSession } from 'next-auth/react';
import { RichText } from 'prismic-dom';
import Head from 'next/head';

import { getPrismicClient } from '../../../services/prismic';

import styles from '../post.module.scss';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

interface PostPreviewProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  };
}

export default function PostPreview({ post }: PostPreviewProps) {
  const {data: session} = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.activeSubscription) {
      router.push(`/posts/${post.slug}`)
    }
  }, [session, post.slug, router])

  return (
    <>
      <Head>
        <title>{post.title} | Ignews</title>
      </Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.title}</h1>
          <time>{post.updatedAt}</time>
          <div
            className={`${styles.postContent} ${styles.previewContent}`}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          <div className={styles.continueReading}>
            Wanna continue reading?
            <Link href="/">Subscribe now 🤗</Link>
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [
      // {params: {
      //   slug: 'axios---um-cliente-http-full-stack'
      // }}
    ],
    // True: Se alguem tentar acessar um post que ainda não foi gerado de forma estatica, carregar o conteúdo pelo lado do browser, causa layout shift, carrega a página, e depois gera o conteúdo. Não é bom para SEO
    // False: Se o post não foi gerado de forma estatica ainda, retorna 404
    // blocking: Se alguem tentar acessar um post que ainda não foi gerado de forma estatica, carrega o conteúdo pela camada do next (Server Side Rendering), qudno todo conteúdo estiver carregado, mostra o html da página.
    fallback: 'blocking'
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('publication', String(slug), {});

  const post = {
    slug,
    title: RichText.asText(response.data.title),
    content: RichText.asHtml(response.data.content.splice(0, 3)),
    updatedAt: new Date(response.last_publication_date).toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
    )
  };
  return {
    props: { post },
    redirect: 60 * 30 // 30 minutes
  }
};
