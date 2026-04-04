import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './sonner-custom.css'
import './globals.css'
import { FirebaseAnalytics } from '@/components/FirebaseAnalytics'
import { APP_NAME, SITE_URL } from '@/lib/statics'

// Firebase認証を使用しているため、動的レンダリングを強制
export const dynamic = 'force-dynamic'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: '%s | ' + APP_NAME,
  },
  description:
    'バイクのメンテナンス履歴・給油記録・整備スケジュールを一元管理するアプリです。',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning={true}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <FirebaseAnalytics />
      </body>
    </html>
  )
}
