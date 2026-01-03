'use client'

import styles from './DesktopSidebar.module.css'
import { NavigationButton } from './NavigationButton'
import { navigationItems } from './navigationItems'

export function DesktopSidebar() {
  return (
    <nav className={styles.sidebar} aria-label="メインナビゲーション">
      {navigationItems.map((item) => (
        <NavigationButton
          key={item.id}
          href={item.href}
          label={item.label}
          icon={item.icon}
        />
      ))}
    </nav>
  )
}
