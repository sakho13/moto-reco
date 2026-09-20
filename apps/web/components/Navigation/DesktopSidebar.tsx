'use client'

import styles from './DesktopSidebar.module.css'
import { NavigationButton } from './NavigationButton'
import { navigationItems } from './navigationItems'
import { RecordButton } from './RecordButton'
import { SidebarBikeRecordLinks } from './SidebarBikeRecordLinks'
import { APP_NAME } from '@/lib/statics'

/**
 * PCの「綴じ代」（サイドバー）
 *
 * @remarks
 * Issue #575 で「手帳の表紙のインデックス」として再設計。
 * 画面の左端から立ち上がり、紙面（本文）と罫で接する。タブレット幅
 * （640〜1023px）はアイコンのみに折りたたみ、デスクトップ幅（1024px〜）で
 * ラベル付きに展開する（幅は `--app-sidebar-w` を参照。globals.css で定義）。
 * 既存項目の下には、アクティブ車両の記録（給油・ツーリング・メンテナンス）
 * への件数付きリンクを区切って並べる（{@link SidebarBikeRecordLinks}）。
 */
export function DesktopSidebar() {
  const [homeItem, myBikeItem, historyItem] = navigationItems

  return (
    <nav className={styles.sidebar} aria-label="メインナビゲーション">
      <div className={styles.brand}>
        <span className={styles.brandName}>{APP_NAME}</span>
      </div>

      <div className={styles.index}>
        <NavigationButton
          variant="rail"
          href={homeItem.href}
          label={homeItem.label}
          icon={homeItem.icon}
          showLabel
        />
        <NavigationButton
          variant="rail"
          href={myBikeItem.href}
          label={myBikeItem.label}
          icon={myBikeItem.icon}
          showLabel
        />
        <NavigationButton
          variant="rail"
          href={historyItem.href}
          label={historyItem.label}
          icon={historyItem.icon}
          showLabel
        />
      </div>

      <SidebarBikeRecordLinks />

      <div className={styles.foot}>
        <RecordButton variant="sidebar" showLabel />
      </div>
    </nav>
  )
}
