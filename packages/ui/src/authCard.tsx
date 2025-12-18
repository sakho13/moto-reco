'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import styles from './authCard.module.css'

/**
 * AuthCardコンポーネントのプロパティ
 */
export interface AuthCardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * カードのタイトル
   */
  title: string
  /**
   * カードのフッター（通常はリンク等）
   */
  footer?: React.ReactNode
  /**
   * カードの内容
   */
  children: React.ReactNode
}

/**
 * AuthCardコンポーネント
 *
 * @remarks
 * 認証ページ（ログイン、新規登録等）用のカードレイアウトコンポーネント。
 * タイトル、フッター、レスポンシブデザインをサポート。
 *
 * @example
 * ```tsx
 * <AuthCard
 *   title="ログイン"
 *   footer={
 *     <p>
 *       アカウントをお持ちでない方は
 *       <Link href="/register">新規登録</Link>
 *     </p>
 *   }
 * >
 *   <form>...</form>
 * </AuthCard>
 * ```
 */
export const AuthCard = forwardRef<HTMLDivElement, AuthCardProps>(
  ({ title, footer, className, children, ...props }, ref) => {
    const cardClasses = [styles.authCard, className].filter(Boolean).join(' ')

    return (
      <div ref={ref} className={cardClasses} {...props}>
        <div className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
        </div>
        <div className={styles.content}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    )
  }
)

AuthCard.displayName = 'AuthCard'
