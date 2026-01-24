import type { Metadata } from 'next'
import './globals.css'

// Firebase認証を使用しているため、動的レンダリングを強制
// export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `管理画面`,
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
