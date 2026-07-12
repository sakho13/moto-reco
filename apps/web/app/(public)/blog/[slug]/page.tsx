import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { BlogToc } from './BlogToc'
import styles from './page.module.css'
import { parseHeadings } from '@/lib/blog/toc'
import { getBlogBySlug } from '@/lib/microcms/blog'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const revalidate = 300

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const blog = await getBlogBySlug(slug)

  if (!blog) {
    return { title: 'ブログ記事が見つかりません' }
  }

  const title = blog.seoTitle || blog.title
  const keywords = blog.tags
    ? blog.tags.split(',').map((v) => v.trim())
    : undefined

  return {
    title,
    description: blog.seoDescription ?? undefined,
    keywords,
    openGraph: {
      url: `${SITE_URL}/blog/${slug}`,
      title: `${title} | ${APP_NAME}`,
      images: blog.eyecatch ? [blog.eyecatch.url] : ['/top_image_1.png'],
    },
    twitter: {
      title: `${title} | ${APP_NAME}`,
      images: blog.eyecatch ? [blog.eyecatch.url] : ['/top_image_1.png'],
    },
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: `/blog/${slug}`,
    },
  }
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params
  const blog = await getBlogBySlug(slug)

  if (!blog) {
    notFound()
  }

  const { headings, contentHtml } = parseHeadings(blog.content)

  return (
    <div className="public-page-container">
      {blog.eyecatch && (
        <div className={styles.eyecatch}>
          <Image
            src={blog.eyecatch.url}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 960px"
            style={{ objectFit: 'cover' }}
            priority
            unoptimized
          />
        </div>
      )}
      <article className={styles.article}>
        <header className={styles.header}>
          <h1 className={styles.articleTitle}>{blog.title}</h1>
          <div className={styles.meta}>
            <time
              className={styles.date}
              dateTime={blog.publishedAt ?? blog.createdAt}
            >
              {new Date(blog.publishedAt ?? blog.createdAt).toLocaleDateString(
                'ja-JP',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }
              )}
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
        </header>

        <BlogToc headings={headings} />

        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>
    </div>
  )
}
