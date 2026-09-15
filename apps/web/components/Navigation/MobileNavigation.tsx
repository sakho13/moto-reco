'use client'

import styles from './MobileNavigation.module.css'
import { NavigationButton } from './NavigationButton'
import { navigationItems } from './navigationItems'
import { RecordButton } from './RecordButton'

export function MobileNavigation() {
  const [homeItem, myBikeItem, historyItem] = navigationItems

  return (
    <nav
      className={styles.bottomNavigation}
      aria-label="モバイルナビゲーション"
    >
      <NavigationButton
        href={homeItem.href}
        label={homeItem.label}
        icon={homeItem.icon}
        showLabel
      />
      <NavigationButton
        href={myBikeItem.href}
        label={myBikeItem.label}
        icon={myBikeItem.icon}
        showLabel
      />
      <RecordButton showLabel />
      <NavigationButton
        href={historyItem.href}
        label={historyItem.label}
        icon={historyItem.icon}
        showLabel
      />
    </nav>
  )
}
