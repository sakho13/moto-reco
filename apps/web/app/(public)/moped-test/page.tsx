import type { Metadata } from 'next'
import { MopedTestClient } from './MopedTestClient'

export const metadata: Metadata = {
  title: '原付学科試験の練習問題',
  description: '原付学科試験向けの○×問題を練習できるページです。',
  alternates: {
    canonical: '/moped-test',
  },
}

export default function MopedTestPage() {
  return <MopedTestClient />
}
