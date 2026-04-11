'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Providers } from '@/components/Providers'
import { useAuth } from '@/lib/hooks/useAuth'

// Firebase認証を使用しているため、動的レンダリングを強制
export const dynamic = 'force-dynamic'

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {children}
    </div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </Providers>
  )
}
