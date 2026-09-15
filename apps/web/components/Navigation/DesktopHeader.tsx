'use client'

import { BikeSwitcher } from './BikeSwitcher'
import { BreadcrumbNav } from './BreadcrumbNav'
import styles from './DesktopHeader.module.css'
import { SettingsButton } from './SettingsButton'
import { BellButton } from '@/components/notification/BellButton'
import { ThemeToggleButton } from '@/components/ThemeToggleButton'

export function DesktopHeader() {
  return (
    <header className={styles.header} aria-label="ヘッダー">
      <BreadcrumbNav />
      <div className={styles.actions}>
        <BikeSwitcher />
        <BellButton />
        <ThemeToggleButton />
        <SettingsButton />
      </div>
    </header>
  )
}
