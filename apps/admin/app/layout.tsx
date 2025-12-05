import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MotoReco Admin',
  description: 'MotoReco 管理画面',
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
