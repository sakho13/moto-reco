'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import styles from './layout.module.css'
import { useAuth } from '@/lib/hooks/useAuth'

// 動的レンダリングを強制
export const dynamic = 'force-dynamic'

/**
 * 認証ページのレイアウト
 *
 * @remarks
 * ログイン・新規登録ページ用のレイアウトコンポーネント。
 * 認証済みユーザーはホームページへ自動的にリダイレクトされる。
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 認証済みユーザーはホームへリダイレクト
    if (!loading && user) {
      router.push('/home')
    }
  }, [user, loading, router])

  // ローディング中
  if (loading) {
    return (
      <div className={styles.authLayout}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未認証の場合のみ子要素を表示
  if (!user) {
    return (
      <div className={styles.authLayout}>
        <div className={styles.authContainer}>{children}</div>
      </div>
    )
  }

  // 認証済みの場合は何も表示しない（リダイレクト処理中）
  return null
}
