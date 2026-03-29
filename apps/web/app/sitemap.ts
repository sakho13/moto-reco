import type { MetadataRoute } from 'next'
import { prisma } from '@repo/database'
import { PrismaMyUserBikeRepository } from '@/lib/api/server/repositories/PrismaMyUserBikeRepository'
import { SITE_URL } from '@/lib/statics'

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
      url: `${SITE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const bikePages = await fetchPublicBikes()

  return [...staticPages, ...bikePages]
}

async function fetchPublicBikes() {
  try {
    const repo = new PrismaMyUserBikeRepository(prisma)
    const bikes = await repo.findPublicBikes()

    const bikesPages: MetadataRoute.Sitemap = bikes.map((bike) => ({
      url: `${SITE_URL}/bikes/${bike.myUserBikeId.toString()}`,
      lastModified: bike.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    return bikesPages
  } catch (error) {
    console.error('Failed to fetch public bikes for sitemap:', error)
    return []
  }
}
