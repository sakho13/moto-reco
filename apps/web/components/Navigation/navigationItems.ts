import { BikeIcon } from '@/components/icons/BikeIcon'
import { HomeIcon } from '@/components/icons/HomeIcon'

export type NavigationItem = {
  id: string
  label: string
  href: string
  icon: React.ComponentType
}

/**
 * ナビゲーションの項目（リンク2枠、中央の「記録」を挟んで左右対称）
 *
 * @remarks
 * 「ホーム／(記録)／愛車」の左右2枠のみを持つ。中央の「記録」は給油シートを
 * 開くボタンで、リンクではないため {@link RecordButton}
 * （`MobileNavigation` / `DesktopSidebar`）として別に描画する。
 * 「ヒストリー」はタブから外した（ホームの「最近の記録」の一覧のため、
 * 常設タブとしては不要と判断）。`/app/history` のURL・ページ自体は残しており、
 * ホームの「すべて見る →」（{@link RecentHistorySection}）から遷移する。
 * 将来イベント機能（#345）を足すときは左右にもう1枠ずつ
 * （「ホーム／イベント／(記録)／愛車」）追加でき、左右の枠数を揃えれば
 * 中央の記録ボタンが画面中心に来る対称性を保てる
 * （`MobileNavigation.module.css` の `.navSlot` を参照）。
 * 「プロフィール」はタブから外し、ホームのヘッダーの設定導線
 * （{@link SettingsButton}）に移した。`/app/profile` のURL自体は変更していない。
 */
export const navigationItems: readonly [NavigationItem, NavigationItem] = [
  { id: 'home', label: 'ホーム', href: '/app/home', icon: HomeIcon },
  { id: 'my-bike', label: '愛車', href: '/app/my-bike', icon: BikeIcon },
]
