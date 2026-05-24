'use client'

import styles from './MobileNavigation.module.css'
import { NavigationButton } from './NavigationButton'
import { navigationItems } from './navigationItems'

export function MobileNavigation() {
  return (
    <nav
      className={styles.bottomNavigation}
      aria-label="モバイルナビゲーション"
    >
      {navigationItems.map((item) => (
        <NavigationButton
          key={item.id}
          href={item.href}
          label={item.label}
          icon={item.icon}
          showLabel
        />
      ))}
    </nav>
  )
}
