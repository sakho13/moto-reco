'use client'

import { BreadcrumbNav } from './BreadcrumbNav'
import styles from './MobileHeader.module.css'
import { BellButton } from '@/components/notification/BellButton'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'

export function MobileHeader() {
  return (
    <header className={styles.header} aria-label="モバイルヘッダー">
      <BreadcrumbNav />
      <div className={styles.actions}>
        <BellButton />
        <ThemeToggleButton />
      </div>
    </header>
  )
}
