'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import styles from './NavigationCard.module.css'

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
   * カードの説明文(オプション)
   */
  description?: string

  /**
   * アイコンコンポーネント(オプション)
   */
  icon?: React.ReactNode

  /**
   * カスタムクラス名(オプション)
   */
  className?: string
}

export const NavigationCard = ({
  href,
  title,
  description,
  icon,
  className,
}: NavigationCardProps) => {
  const cardClasses = [styles.navigationCard, className]
    .filter(Boolean)
    .join(' ')

  return (
    <Link href={href} className={cardClasses}>
      {icon && <div className={styles.iconContainer}>{icon}</div>}
      <div className={styles.textContainer}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <ChevronRight className={styles.chevron} />
    </Link>
  )
}
