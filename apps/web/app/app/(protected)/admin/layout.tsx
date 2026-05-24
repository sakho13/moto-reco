'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

type Props = {
  children: React.ReactNode
}

export default function AdminLayout({ children }: Props) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    // Firebase カスタムクレームではなく API 経由でロールを確認する実装では、
    // 画面側でのロールチェックは adminAPI の 403 で弾く。
    // ここでは未ログインのみガードする。
    if (!user) {
      router.replace('/app/login')
    }
  }, [user, loading, router])

  if (loading || !user) return null

  return <>{children}</>
}
