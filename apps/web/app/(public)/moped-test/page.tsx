import type { Metadata } from 'next'
import { MopedTestClient } from './MopedTestClient'
import { SITE_URL } from '@/lib/statics'

export const metadata: Metadata = {
  title: '原付免許試験の練習問題',
  description: '原付免許試験の○×問題を練習できるページです。',
  keywords: [
    '原付',
    '原動機付自転車',
    '電動キックボード',
    '免許',
    '模擬試験',
    '免許テスト',
    'モペット',
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/moped-test',
  },
}

export default function MopedTestPage() {
  return <MopedTestClient />
}
