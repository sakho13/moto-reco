'use client'

import styles from './MobileHeader.module.css'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'
import { APP_NAME } from '@/lib/statics'

export function MobileHeader() {
  return (
    <header className={styles.header} aria-label="モバイルヘッダー">
      <span className={styles.appName}>{APP_NAME}</span>
      <div className={styles.actions}>
        <ThemeToggleButton />
      </div>
    </header>
  )
}
