import { useState } from 'react';

import Head from 'next/head';
import Link from 'next/link';

import { AiOutlineCalendar as Calendar } from 'react-icons/ai';
import { AiOutlineUser as User } from 'react-icons/ai';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Prismic from '@prismicio/client';
import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';
import common from '../styles/common.module.scss';

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

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  const handleRenderNextPage = async (): Promise<void> => {
    const response = await fetch(nextPage);
    const data = await response.json();
    const newPosts = data.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.last_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });
    setPosts([...posts, ...newPosts]);
    setNextPage(data.next_page);
  };

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <main className={common.container}>
        <div className={styles.homePage}>
          {postsPagination.results.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.infos}>
                  <Calendar />
                  <time>{post.first_publication_date}</time>
                  <User /> <span>{post.data.author}</span>
                </div>
              </a>
            </Link>
          ))}
          {nextPage && (
            <a
              className={styles.loadMore}
              href="/"
              onClick={handleRenderNextPage}
            >
              Carregar mais posts
            </a>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 1,
    }
  );

  const { next_page } = postsResponse;
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.last_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
      data: {
        uid: post.uid,
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page,
        results: posts,
      },
      revalidate: 60 * 30, // 30 min
    },
  };
};
