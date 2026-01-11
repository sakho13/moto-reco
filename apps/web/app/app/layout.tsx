import type { Metadata } from 'next'
import { Footer } from '@/components/Footer'
import { Providers } from '@/components/Providers'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'

// Firebase認証を使用しているため、動的レンダリングを強制
export const dynamic = 'force-dynamic'

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
    <>
      <Providers>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggleButton />
        </div>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1 }}>{children}</div>

          <Footer />
        </div>
      </Providers>
    </>
  )
}
