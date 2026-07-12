'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './NavigationButton.module.css'

interface NavigationButtonProps {
  href: string
  label: string
  icon: React.ComponentType
  showLabel?: boolean
}

export function NavigationButton({
  href,
  label,
  icon: Icon,
  showLabel = false,
}: NavigationButtonProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`${styles.navButton} ${isActive ? styles.active : ''} ${showLabel ? styles.withLabel : ''}`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      title={label}
    >
      <Icon />
      {showLabel && <span className={styles.label}>{label}</span>}
    </Link>
  )
}
