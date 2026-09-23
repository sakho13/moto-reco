'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './NavigationButton.module.css'

interface NavigationButtonProps {
  href: string
  label: string
  icon: React.ComponentType
  showLabel?: boolean
  /**
   * 表示バリアント
   * - `tab`: モバイル下部ナビの縦積みタブ（既定）
   * - `rail`: デスクトップサイドバーの横積みインデックス行
   */
  variant?: 'tab' | 'rail'
}

export function NavigationButton({
  href,
  label,
  icon: Icon,
  showLabel = false,
  variant = 'tab',
}: NavigationButtonProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`${styles.navButton} ${variant === 'rail' ? styles.rail : ''} ${isActive ? styles.active : ''} ${showLabel ? styles.withLabel : ''}`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      title={label}
    >
      <Icon />
      {showLabel && <span className={styles.label}>{label}</span>}
    </Link>
  )
}
