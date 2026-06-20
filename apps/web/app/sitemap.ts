import type { MetadataRoute } from 'next'
import { getCurrentDate } from '@repo/shared-utils'
import { microCMSClient } from '@/lib/microcms/config'
import type { Blog } from '@/lib/microcms/types'
import { SITE_URL } from '@/lib/statics'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = getCurrentDate()
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/moped-test`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/release-note`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  const [blogPages] = await Promise.all([fetchBlogPages()])

  return [...staticPages, ...blogPages]
}

async function fetchBlogPages() {
  try {
    if (!microCMSClient) return []
    const data = await microCMSClient.getList<Blog>({
      endpoint: 'motoreco-blogs',
      queries: {
        orders: '-publishedAt',
        limit: 100,
        fields: 'slug,updatedAt',
        filters:
          process.env.NODE_ENV !== 'development'
            ? 'status[contains]published'
            : undefined,
      },
    })
    console.log(`[sitemap] ブログ記事取得: ${data.contents.length}件`)

    return data.contents.map((blog): MetadataRoute.Sitemap[number] => ({
      url: `${SITE_URL}/blog/${blog.slug}`,
      lastModified: new Date(blog.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  } catch (error) {
    console.error('[sitemap] ブログ記事取得失敗', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return []
  }
}
