'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './NavigationButton.module.css'

interface NavigationButtonProps {
  href: string
  label: string
  icon: React.ComponentType
}

export function NavigationButton({
  href,
  label,
  icon: Icon,
}: NavigationButtonProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`${styles.navButton} ${isActive ? styles.active : ''}`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      title={label}
    >
      <Icon />
    </Link>
  )
}
