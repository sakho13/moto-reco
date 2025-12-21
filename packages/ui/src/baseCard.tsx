'use client'

import { type HTMLAttributes, forwardRef } from 'react'
import styles from './baseCard.module.css'

/**
 * BaseCardコンポーネントのプロパティ
 */
export interface BaseCardProps extends HTMLAttributes<HTMLDivElement> {
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
 * BaseCardコンポーネント
 *
 * @remarks
 * 汎用的なカードレイアウトコンポーネント。
 * タイトル、フッター、レスポンシブデザインをサポート。
 *
 * @example
 * ```tsx
 * <BaseCard
 *   title="ログイン"
 *   footer={
 *     <p>
 *       アカウントをお持ちでない方は
 *       <Link href="/register">新規登録</Link>
 *     </p>
 *   }
 * >
 *   <form>...</form>
 * </BaseCard>
 * ```
 */
export const BaseCard = forwardRef<HTMLDivElement, BaseCardProps>(
  ({ title, footer, className, children, ...props }, ref) => {
    const cardClasses = [styles.baseCard, className].filter(Boolean).join(' ')

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

BaseCard.displayName = 'BaseCard'
