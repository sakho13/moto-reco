'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type ComponentType } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * 認証が必要なページをラップするHOC
 *
 * @remarks
 * このHOCでラップされたコンポーネントは、認証済みユーザーのみがアクセスできます。
 * 未認証ユーザーは自動的に`/login`ページへリダイレクトされます。
 *
 * @param Component - ラップするコンポーネント
 * @returns 認証済みの場合のみ表示されるコンポーネント
 *
 * @example
 * ```tsx
 * // ダッシュボードページを保護
 * function DashboardPage() {
 *   return <div>ダッシュボード</div>
 * }
 *
 * export default withAuth(DashboardPage)
 * ```
 *
 * @example
 * ```tsx
 * // プロフィールページを保護
 * const ProfilePage = () => {
 *   return <div>プロフィール</div>
 * }
 *
 * export default withAuth(ProfilePage)
 * ```
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  const AuthenticatedComponent = (props: P) => {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      // ローディングが完了し、ユーザーが未認証の場合、ログインページへリダイレクト
      if (!loading && !user) {
        router.push('/app/login')
      }
    }, [user, loading, router])

    // ローディング中
    if (loading) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 'var(--spacing-4)',
          }}
        >
          <div
            style={{
              width: '3rem',
              height: '3rem',
              border: '4px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: 'var(--radius-full)',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p
            style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-muted-foreground)',
            }}
          >
            認証確認中...
          </p>
        </div>
      )
    }

    // 未認証（リダイレクト処理中）
    if (!user) {
      return null
    }

    // 認証済み - コンポーネントを表示
    return <Component {...props} />
  }

  // デバッグ用のdisplayName設定
  AuthenticatedComponent.displayName = `withAuth(${
    Component.displayName || Component.name || 'Component'
  })`

  return AuthenticatedComponent
}
