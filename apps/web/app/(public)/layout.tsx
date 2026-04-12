import type { Metadata } from 'next'
import { ThemeProvider } from '@repo/ui/context/ThemeContext'
import './globals.css'
import { Footer } from '@/components/docs/Footer'
import { Navigation } from '@/components/docs/Navigation'
import { APP_NAME, SITE_URL } from '@/lib/statics'

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: '%s | ' + APP_NAME,
  },
  description:
    'バイクのメンテナンス履歴・給油記録・整備スケジュールを一元管理するアプリです。',
  metadataBase: new URL(SITE_URL),
  keywords: [
    'バイク',
    'bike',
    'モーターサイクル',
    'motorcycle',
    '原付',
    'エコ',
    '給油',
    '燃費',
    '整備',
    'メンテナンス',
    'バイク管理',
    'ツーリング',
    'ツーリング記録',
  ],
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <ThemeProvider initialThemeName="default">
        <Navigation />

        {children}

        <Footer />
      </ThemeProvider>
    </>
  )
}
