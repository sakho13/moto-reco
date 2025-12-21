'use client'

import Link from 'next/link'
import styles from './navigationCard.module.css'

export interface NavigationCardProps {
  /**
   * リンク先のURL
   */
  href: string

  /**
   * カードのタイトル
   */
  title: string

  /**
   * カードの説明文（オプション）
   */
  description?: string

  /**
   * アイコンコンポーネント（オプション）
   */
  icon?: React.ReactNode

  /**
   * アニメーションを無効にするフラグ（アクセシビリティ対応）
   * @default false
   */
  disableAnimation?: boolean

  /**
   * カスタムクラス名（オプション）
   */
  className?: string
}

/**
 * NavigationCardコンポーネント
 *
 * @remarks
 * ホーム画面などで使用するリンク専用カードコンポーネント。
 * 微細な揺れアニメーション、hover/activeステートをサポート。
 *
 * @example
 * ```tsx
 * <NavigationCard
 *   href="/profile/edit"
 *   title="プロフィール編集"
 *   description="あなたのプロフィール情報を更新できます"
 *   icon={<ProfileIcon />}
 * />
 * ```
 */
export const NavigationCard = ({
  href,
  title,
  description,
  icon,
  disableAnimation = false,
  className,
}: NavigationCardProps) => {
  const cardClasses = [styles.navigationCard, className]
    .filter(Boolean)
    .join(' ')

  return (
    <Link
      href={href}
      className={cardClasses}
      data-disable-animation={disableAnimation}
    >
      {icon && <div className={styles.iconContainer}>{icon}</div>}
      <div className={styles.textContainer}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>
    </Link>
  )
}
