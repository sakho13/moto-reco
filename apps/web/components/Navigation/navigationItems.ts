import { BikeIcon } from '@/components/icons/BikeIcon'
import { HistoryIcon } from '@/components/icons/HistoryIcon'
import { HomeIcon } from '@/components/icons/HomeIcon'

export type NavigationItem = {
  id: string
  label: string
  href: string
  icon: React.ComponentType
}

/**
 * ナビゲーションの項目（リンク3枠）
 *
 * @remarks
 * Issue #575 で決まったタブ構成
 * 「ホーム／愛車／(記録)／ヒストリー」のうち、リンクである3枠のみを持つ。
 * 中央の「記録」は給油シートを開くボタンで、リンクではないため
 * {@link RecordButton}（`MobileNavigation` / `DesktopSidebar`）として別に描画する。
 * 5枠目はイベント機能（#345）のために空けてある。
 * 「プロフィール」はタブから外し、ホームのヘッダーの設定導線
 * （{@link SettingsButton}）に移した。`/app/profile` のURL自体は変更していない。
 */
export const navigationItems: readonly [
  NavigationItem,
  NavigationItem,
  NavigationItem,
] = [
  { id: 'home', label: 'ホーム', href: '/app/home', icon: HomeIcon },
  { id: 'my-bike', label: '愛車', href: '/app/my-bike', icon: BikeIcon },
  {
    id: 'history',
    label: 'ヒストリー',
    href: '/app/history',
    icon: HistoryIcon,
  },
]
