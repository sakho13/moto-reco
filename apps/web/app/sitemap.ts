import type { MetadataRoute } from 'next'
import { prisma } from '@repo/database'
import { PrismaMyUserBikeRepository } from '@/lib/api/server/repositories/PrismaMyUserBikeRepository'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repo = new PrismaMyUserBikeRepository(prisma)
  const bikes = await repo.findPublicBikes()

  const bikesPages: MetadataRoute.Sitemap = bikes.map((bike) => ({
    url: `https://moto-reco.com/bikes/${bike.myUserBikeId}`,
    lastModified: bike.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [
    {
      url: 'https://moto-reco.com',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: 'https://moto-reco.com/bikes',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://moto-reco.com/faq',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://moto-reco.com/pricing',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://moto-reco.com/privacy-policy',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    ...bikesPages,
  ]
}
