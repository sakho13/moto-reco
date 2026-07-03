import type { MetadataRoute } from 'next'
import { getCurrentDate } from '@repo/shared-utils'
import { getBlogSitemapEntries } from '@/lib/microcms/blog'
import { getReleaseNoteSitemapEntries } from '@/lib/microcms/releaseNote'
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

  const [blogEntries, releaseNoteEntries] = await Promise.all([
    getBlogSitemapEntries(),
    getReleaseNoteSitemapEntries(),
  ])

  const blogPages: MetadataRoute.Sitemap = blogEntries.map((blog) => ({
    url: `${SITE_URL}/blog/${blog.slug}`,
    lastModified: new Date(blog.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const releaseNotePages: MetadataRoute.Sitemap = releaseNoteEntries.map(
    (note) => ({
      url: `${SITE_URL}/release-note/${note.version}`,
      lastModified: new Date(note.updatedAt),
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  )

  return [...staticPages, ...blogPages, ...releaseNotePages]
}
