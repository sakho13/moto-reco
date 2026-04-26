import type { MicroCMSImage, MicroCMSListContent } from 'microcms-js-sdk'

export type ReleaseNote = {
  title: string
  version: string
  content: string
} & MicroCMSListContent

export type Blog = {
  title: string
  slug: string
  keyword: string[]
  content: string
  eyecatch?: MicroCMSImage
} & MicroCMSListContent
