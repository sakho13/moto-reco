'use client'

import styles from './MobileNavigation.module.css'
import { NavigationButton } from './NavigationButton'
import { navigationItems } from './navigationItems'
import { RecordButton } from './RecordButton'

export function MobileNavigation() {
  const [homeItem, myBikeItem] = navigationItems

  return (
    <nav
      className={styles.bottomNavigation}
      aria-label="モバイルナビゲーション"
    >
      {/*
        左右のスロットは等幅（`flex: 1`）にして、中央の記録ボタンが
        実際の画面中心に来るようにする（左右対称）。枠が増える場合も
        左右で数を揃えれば対称のまま拡張できる（navigationItems.ts参照）。
      */}
      <div className={styles.navSlot}>
        <NavigationButton
          href={homeItem.href}
          label={homeItem.label}
          icon={homeItem.icon}
          showLabel
        />
      </div>
      <div className={styles.recordSlot}>
        <RecordButton showLabel />
      </div>
      <div className={styles.navSlot}>
        <NavigationButton
          href={myBikeItem.href}
          label={myBikeItem.label}
          icon={myBikeItem.icon}
          showLabel
        />
      </div>
    </nav>
  )
}
