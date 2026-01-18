import type { Metadata } from 'next'
import './globals.css'
import { Footer } from '@/components/docs/Footer'
import { Navigation } from '@/components/docs/Navigation'
import { APP_NAME } from '@/lib/statics'

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} | バイクメンテナンス・給油記録管理アプリ`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    'バイクのメンテナンス履歴・給油記録・整備スケジュールを一元管理するアプリです。',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: APP_NAME,
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Navigation />

      {children}

      <Footer />
    </>
  )
}
