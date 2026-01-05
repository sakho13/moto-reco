'use client'

import { usePathname } from 'next/navigation'
import styles from './Footer.module.css'

export function Footer() {
  const pathname = usePathname()

  // /ref ページでは表示しない
  if (pathname === '/ref') {
    return null
  }

  return (
    <footer className={styles.footer}>
      <div>
        <p>moto-reco Documentation</p>
        <span>プロダクトの詳細は随時更新されます。</span>
      </div>
    </footer>
  )
}
