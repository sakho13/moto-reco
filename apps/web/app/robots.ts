import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/statics'

export default function robots(): MetadataRoute.Robots {
  return {
    host: SITE_URL,
    sitemap: `${SITE_URL}/sitemap.xml`,
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api-doc', '/fonts', '/app', '/api'],
    },
  }
}
