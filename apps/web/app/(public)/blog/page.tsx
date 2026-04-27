import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import styles from './page.module.css'
import { microCMSClient } from '@/lib/microcms/config'
import type { Blog } from '@/lib/microcms/types'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const revalidate = 300

export const metadata: Metadata = {
  title: `ブログ`,
  description: `${APP_NAME} のブログ。バイクメンテナンスや給油記録に関する情報をお届けします。`,
  openGraph: {
    url: `${SITE_URL}/blog`,
    title: `ブログ | ${APP_NAME}`,
    description: `${APP_NAME} のブログ。バイクメンテナンスや給油記録に関する情報をお届けします。`,
    images: ['/top_image_1.png'],
  },
  twitter: {
    title: `ブログ | ${APP_NAME}`,
    description: `${APP_NAME} のブログ。バイクメンテナンスや給油記録に関する情報をお届けします。`,
    images: ['/top_image_1.png'],
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/blog',
  },
}

async function getBlogs(): Promise<Blog[]> {
  const filter =
    process.env.NODE_ENV !== 'development'
      ? 'status[equals]published'
      : undefined
  console.log('[microCMS] getBlogs filter:', filter)
  try {
    if (!microCMSClient) {
      console.warn('[microCMS] getBlogs: client is null')
      return []
    }
    const data = await microCMSClient.getList<Blog>({
      endpoint: 'motoreco-blogs',
      queries: {
        orders: '-publishedAt',
        limit: 100,
        filters: filter,
      },
    })
    console.log(
      '[microCMS] getBlogs count:',
      data.contents.length,
      'total:',
      data.totalCount
    )
    return data.contents
  } catch (e) {
    console.error('[microCMS] getBlogs error:', e)
    return []
  }
}

export default async function BlogPage() {
  const blogs = await getBlogs()

  return (
    <div className="public-page-container">
      <header className={styles.header}>
        <h1 className={styles.title}>ブログ</h1>
        <p className={styles.description}>
          バイクメンテナンスや給油記録に関する情報をお届けします。
        </p>
      </header>

      {blogs.length === 0 ? (
        <div className={styles.empty}>
          <p>現在、記事はありません。</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blog/${blog.slug}`}
              className={styles.card}
            >
              {blog.eyecatch && (
                <div className={styles.eyecatch}>
                  <Image
                    src={blog.eyecatch.url}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 100vw, 360px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>
              )}
              <div className={styles.cardBody}>
                <p className={styles.cardTitle}>{blog.title}</p>
                <div className={styles.meta}>
                  <time
                    className={styles.date}
                    dateTime={blog.publishedAt ?? blog.createdAt}
                  >
                    {new Date(
                      blog.publishedAt ?? blog.createdAt
                    ).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  {blog.keyword.length > 0 && (
                    <ul className={styles.keywords}>
                      {blog.keyword.map((kw: string) => (
                        <li key={kw} className={styles.keyword}>
                          {kw}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
