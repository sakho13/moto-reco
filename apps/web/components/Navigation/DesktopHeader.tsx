'use client'

import { BreadcrumbNav } from './BreadcrumbNav'
import styles from './DesktopHeader.module.css'
import { BellButton } from '@/components/notification/BellButton'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'

export function DesktopHeader() {
  return (
    <header className={styles.header} aria-label="ヘッダー">
      <BreadcrumbNav />
      <div className={styles.actions}>
        <BellButton />
        <ThemeToggleButton />
      </div>
    </header>
  )
}
