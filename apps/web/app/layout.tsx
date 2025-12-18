import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Providers } from '../components/Providers'
import './globals.css'

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
  title: 'MotoReco Web App',
  description: 'MotoReco Web Application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
