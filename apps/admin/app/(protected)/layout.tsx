'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Providers } from '@/components/Providers'
import { useAuth } from '@/lib/hooks/useAuth'

// Firebase認証を使用しているため、動的レンダリングを強制
export const dynamic = 'force-dynamic'

function ProtectedLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, loading, getIdToken, signOut } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    // ADMINロール確認
    const verifyAdmin = async () => {
      const token = await getIdToken()
      if (!token) {
        router.replace('/login')
        return
      }

      const res = await fetch('/api/admin/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 403) {
        await signOut()
        toast.error('管理者権限が必要です')
        router.replace('/login')
      } else if (!res.ok) {
        router.replace('/login')
      }
    }

    verifyAdmin()
  }, [user, loading, getIdToken, signOut, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-14 items-center px-6">
          <span className="font-semibold">MotoReco Admin</span>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <ProtectedLayoutInner>{children}</ProtectedLayoutInner>
    </Providers>
  )
}
