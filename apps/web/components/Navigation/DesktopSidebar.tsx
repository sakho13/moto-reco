'use client'

import styles from './DesktopSidebar.module.css'
import { NavigationButton } from './NavigationButton'
import { navigationItems } from './navigationItems'
import { RecordButton } from './RecordButton'

export function DesktopSidebar() {
  const [homeItem, myBikeItem, historyItem] = navigationItems

  return (
    <nav className={styles.sidebar} aria-label="メインナビゲーション">
      <NavigationButton
        href={homeItem.href}
        label={homeItem.label}
        icon={homeItem.icon}
      />
      <NavigationButton
        href={myBikeItem.href}
        label={myBikeItem.label}
        icon={myBikeItem.icon}
      />
      <RecordButton variant="sidebar" />
      <NavigationButton
        href={historyItem.href}
        label={historyItem.label}
        icon={historyItem.icon}
      />
    </nav>
  )
}
