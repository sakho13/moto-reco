import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Footer } from '../components/Footer'
import { Navigation } from '../components/Navigation'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'moto-reco Docs',
  description: 'バイクメンテナンス管理アプリ moto-reco のドキュメントサイト',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactElement {
  return (
    <html lang="ja" suppressHydrationWarning={true}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Navigation />

        {children}

        <Footer />
      </body>
    </html>
  )
}
