import type { Metadata } from 'next'
import './globals.css'
import { Footer } from '@/components/docs/Footer'
import { Navigation } from '@/components/docs/Navigation'

export const metadata: Metadata = {
  title: 'moto-reco Docs',
  description: 'バイクメンテナンス管理アプリ moto-reco のドキュメントサイト',
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
