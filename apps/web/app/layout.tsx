import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './sonner-custom.css'
import './globals.css'
import { FirebaseAnalytics } from '@/components/FirebaseAnalytics'

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
    <html lang="ja" suppressHydrationWarning={true}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <FirebaseAnalytics />
        {children}
      </body>
    </html>
  )
}
