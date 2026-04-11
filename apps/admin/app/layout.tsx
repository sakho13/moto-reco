import type { Metadata } from 'next'
import './globals.css'
import { APP_NAME } from '@/lib/statics'

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: 'MotoReco 管理画面',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning={true}>
      <body>{children}</body>
    </html>
  )
}
