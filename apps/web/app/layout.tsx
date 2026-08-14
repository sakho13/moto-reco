import type { Metadata } from 'next'
import './sonner-custom.css'
import './globals.css'
import { FirebaseAnalytics } from '@/components/FirebaseAnalytics'
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning={true}>
      <body>
        {children}
        <FirebaseAnalytics />
      </body>
    </html>
  )
}
