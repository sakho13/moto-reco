'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Navigation.module.css'

interface NavLink {
  href: string
  label: string
}

const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'ホーム' },
  { href: '/about', label: 'このアプリについて' },
  { href: '/faq', label: 'FAQ' },
  { href: '/pricing', label: '料金プラン' },
]

export function Navigation() {
  const pathname = usePathname()

  // /ref ページでは表示しない
  if (pathname === '/api-doc') {
    return null
  }

  return (
    <nav className={styles.nav} aria-label="メインナビゲーション">
      <div className={styles.navContainer}>
        <ul className={styles.navList}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
        <Link
          href={`/app/login`}
          target="_blank"
          rel="noreferrer"
          className={styles.loginButton}
          aria-label="ログインページを新しいタブで開く"
        >
          ログイン
        </Link>
      </div>
    </nav>
  )
}
