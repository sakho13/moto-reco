import type { MetadataRoute } from 'next'
import { prisma } from '@repo/database'
import { PrismaMyUserBikeRepository } from '@/lib/api/server/repositories/PrismaMyUserBikeRepository'
import { microCMSClient } from '@/lib/microcms/config'
import type { Blog } from '@/lib/microcms/types'
import { SITE_URL } from '@/lib/statics'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/bikes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/moped-test`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/release-note`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  const [bikePages, blogPages] = await Promise.all([
    fetchPublicBikes(),
    fetchBlogPages(),
  ])

  return [...staticPages, ...bikePages, ...blogPages]
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

async function fetchPublicBikes() {
  try {
    const repo = new PrismaMyUserBikeRepository(prisma)
    const bikes = await repo.findPublicBikes()
    console.log(`[sitemap] 公開バイク取得: ${bikes.length}件`)

    const bikesPages: MetadataRoute.Sitemap = bikes.map((bike) => ({
      url: `${SITE_URL}/bikes/${bike.myUserBikeId.toString()}`,
      lastModified: bike.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    return bikesPages
  } catch (error) {
    console.error('[sitemap] 公開バイク取得失敗', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return []
  }
}
