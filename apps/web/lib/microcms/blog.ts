import { safeGetList, safeGetListItem, withPublishedFilter } from './queries'
import type { Blog } from './types'

const ENDPOINT = 'motoreco-blogs'

export async function getBlogs(): Promise<Blog[]> {
  return safeGetList<Blog>(ENDPOINT, {
    orders: '-publishedAt',
    limit: 100,
    filters: withPublishedFilter(),
  })
}

export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  return safeGetListItem<Blog>(ENDPOINT, {
    filters: withPublishedFilter(`slug[equals]${slug}`),
  })
}

export async function getBlogSitemapEntries(): Promise<
  Pick<Blog, 'slug' | 'updatedAt'>[]
> {
  return safeGetList<Pick<Blog, 'slug' | 'updatedAt'>>(
    ENDPOINT,
    {
      orders: '-publishedAt',
      limit: 100,
      fields: 'slug,updatedAt',
      filters: withPublishedFilter(),
    },
    'sitemap:blog'
  )
}
