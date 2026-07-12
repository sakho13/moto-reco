import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import { APP_NAME } from '@/lib/statics'

// Firebase認証を使用しているため、動的レンダリングを強制
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: 'バイクメンテナンス・給油記録管理アプリ',
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
    <>
      <Providers>{children}</Providers>
    </>
  )
}
