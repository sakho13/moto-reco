import type { MicroCMSImage, MicroCMSListContent } from 'microcms-js-sdk'

export type Blog = {
  title: string
  slug: string
  keyword: string[]
  content: string
  eyecatch?: MicroCMSImage
  tags: string
  seoTitle: string
  seoDescription: string
} & MicroCMSListContent
