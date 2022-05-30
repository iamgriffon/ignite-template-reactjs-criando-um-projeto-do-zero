import { useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home(props: HomeProps) {
  const [posts, setPosts] = useState(props.postsPagination.results);
  const [nextPage, setNextPage] = useState(props.postsPagination.next_page);

  useEffect(() => {
    let script = document.createElement('script');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin','anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute('repo', 'johnnycfg/desafio01-trilha-reactjs-space-traveling');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute( 'theme', 'github-dark');
  }, []);


  async function loadMorePosts() {
    if (!nextPage) {
      return;
    }

    await fetch(nextPage)
      .then(function(response) {
        console.log(response);
        return response.json();
      })
      .then(function(data){
        console.log(data);
        const newPosts = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            }
          }
        });

        setPosts([...posts, ...newPosts]);

        setNextPage(data.next_page)
      })
  };

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a className={styles.post}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <footer>
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
                </footer>
              </a>
            </Link>
          ))}

          { nextPage && <button onClick={loadMorePosts}>Carregar mais posts</button> }
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'spacetravelling')],
    {

      pageSize: 1,
    }
  );

  const nextPage = postsResponse.next_page;

  const posts:Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  });

  return {
    props: {
      postsPagination: {
        next_page: nextPage,
        results: posts
      }
    }
  }
};