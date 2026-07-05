'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './DocsSidebar.module.css'

const NAV_ITEMS = [{ label: 'MCPセットアップ', href: '/docs/mcp' }]

export function DocsSidebar() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav}>
      <p className={styles.groupLabel}>Docs</p>
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`${styles.link} ${pathname === item.href ? styles.active : ''}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
