import type { Metadata } from 'next'
import './globals.css'
import '@refinedev/antd/dist/reset.css'

export const metadata: Metadata = {
  title: 'Motoreco 管理画面',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
