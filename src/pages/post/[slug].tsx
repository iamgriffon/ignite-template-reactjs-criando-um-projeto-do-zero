import { useEffect } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import format from 'date-fns/format';
import { ptBR } from 'date-fns/locale';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url?: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  navigation: {
    prevPost: {
      uid: string | null;
      data: {
        title: string | null;
      }
    };
    nextPost: {
      uid: string | null;
      data: {
        title: string | null;
      }
    };
  };
}

export default function Post({ post, navigation, preview }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  const formattedPostContent = post.data.content.map(section => {
    const text = section.body.reduce((acc, cur) => {
      return acc = acc.concat(RichText.asHtml([cur]));
    }, '');

    return {
      heading: section.heading,
      body: text,
    }
  });

  const textLenght = formattedPostContent.reduce(function(acc, cur) {
    const wordsHeading = cur.heading.split(' ');
    const wordsBody = cur.body.split(' ');
    return acc + wordsHeading.length + wordsBody.length;
  }, 0)

  const readingDuration = Math.ceil(textLenght / 200);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt='logo' />
        </div>
        <div className={styles.post}>
          <header>
            <strong>{post.data.title}</strong>

            <div className={styles.postData}>
              <time>
                <FiCalendar />
                {
                  format(
                    new Date(post.first_publication_date),
                    'dd MMM u',
                    {locale: ptBR}
                  )
                }
              </time>

              <span><FiUser /> {post.data.author}</span>

              <span><FiClock /> {readingDuration} min</span>
            </div>

              <span className={styles.postLastUpdate}>
                {
                  `
                    * editado em ${format(new Date(post.last_publication_date), 'dd MMM u', {locale: ptBR})},
                    às ${format(new Date(post.last_publication_date), 'k:m', {locale: ptBR})}
                  `
                }
              </span>
          </header>

          <article className={styles.postContent}>
            {formattedPostContent.map(section => {
              return (
                <section key={section.heading}>
                  <strong>{section.heading}</strong>
                  <div dangerouslySetInnerHTML={{__html: section.body}}/>
                </section>
              )
            })}
          </article>
        </div>

        <hr />

        <div className={styles.postsNavigation}>
          { navigation?.prevPost.uid != null ? (
            <div>
              <p>{navigation.prevPost.data.title}</p>
              <a href={`/post/${navigation.prevPost.uid}`}>Post anterior</a>
            </div>
          ) : (
            <div></div>
          )}

          {navigation?.nextPost.uid != null && (
            <div>
              <p>{navigation.nextPost.data.title}</p>
              <a href={`/post/${navigation.nextPost.uid}`}>Próximo post</a>
            </div>
          )}
        </div>


        <div className={styles.utterancesComments} id="utterances-comments"></div>

        {preview && (
          <div className={styles.exitPreviewButton}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </div>
        )}
      </main>

    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'spacetravelling')],

  );

  const postsSlugArr = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    };
  });

  return {
    paths: postsSlugArr,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData
}) => {
  const {slug} = params;
  const previewRef = previewData ? previewData.ref : null;
  const refOption = previewRef ? { ref: previewRef } : null;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('spacetravelling', String(slug), refOption);

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'spacetravelling')],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
      after: response.id,
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'spacetravelling')],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date]',
      after: response.id,
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(section => {
        return {
          heading: section.heading,
          body: section.body.map(item => {
              return item;
          })
        }
      }),
    },
  };

  return {
    props: {
      post,
      preview,
      navigation: {
        prevPost: {
          uid: prevPost.results[0]?.uid ? prevPost.results[0].uid : null,
          data: {
            title: prevPost.results[0]?.data.title ? prevPost.results[0].data.title : null,
          }
        },
        nextPost: {
          uid: nextPost.results[0]?.uid ? nextPost.results[0].uid : null,
          data: {
            title: nextPost.results[0]?.data.title ? nextPost.results[0].data.title : null,
          }
        }
      },
    },
    revalidate: 60 * 60, // 60 minutes
  }
};