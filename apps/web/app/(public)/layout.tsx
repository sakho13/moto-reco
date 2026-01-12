import type { Metadata } from 'next'
import './globals.css'
import { Footer } from '@/components/docs/Footer'
import { Navigation } from '@/components/docs/Navigation'
import { APP_NAME } from '@/lib/statics'

export const metadata: Metadata = {
  title: `${APP_NAME}`,
  description: `バイクメンテナンス管理アプリ ${APP_NAME} のトップページです。`,
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
