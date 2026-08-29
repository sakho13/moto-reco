import type { MetadataRoute } from 'next'
import { prisma } from '@repo/database'
import {
  GoodsModelSitemapEntry,
  IGoodsModelRepository,
} from '@repo/shared-domain'
import { getCurrentDate } from '@repo/shared-utils'
import { PrismaGoodsModelRepository } from '@/lib/api/server/repositories/PrismaGoodsModelRepository'
import { getBlogSitemapEntries } from '@/lib/microcms/blog'
import { SITE_URL } from '@/lib/statics'

export const revalidate = 300

const GOODS_SITEMAP_FETCH_TIMEOUT_MS = 5000

/**
 * グッズ型番のsitemapエントリを取得する。
 * ビルド時などDBに接続できない・応答が遅い環境でもsitemap全体の生成を止めないよう、
 * 取得失敗・タイムアウト時は空配列にフォールバックする（microCMSのsafeGetListと同様の方針）
 */
async function getGoodsSitemapEntries(
  repository: IGoodsModelRepository
): Promise<GoodsModelSitemapEntry[]> {
  try {
    return await Promise.race([
      repository.findAllForSitemap(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('goods sitemap取得がタイムアウトしました')),
          GOODS_SITEMAP_FETCH_TIMEOUT_MS
        )
      ),
    ])
  } catch (error) {
    console.error('[sitemap:goods] 取得失敗', {
      message: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

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
      url: `${SITE_URL}/goods`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
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

  const goodsModelRepo = new PrismaGoodsModelRepository(prisma)

  const [blogEntries, goodsEntries] = await Promise.all([
    getBlogSitemapEntries(),
    getGoodsSitemapEntries(goodsModelRepo),
  ])

  const blogPages: MetadataRoute.Sitemap = blogEntries.map((blog) => ({
    url: `${SITE_URL}/blog/${blog.slug}`,
    lastModified: new Date(blog.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const goodsPages: MetadataRoute.Sitemap = goodsEntries.map((goods) => ({
    url: `${SITE_URL}/goods/${goods.id}`,
    lastModified: goods.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  return [...staticPages, ...blogPages, ...goodsPages]
}
