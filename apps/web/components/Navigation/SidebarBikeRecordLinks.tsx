'use client'

import Link from 'next/link'
import styles from './SidebarBikeRecordLinks.module.css'
import { FuelIcon } from '@/components/icons/FuelIcon'
import { TouringIcon } from '@/components/icons/TouringIcon'
import { WrenchIcon } from '@/components/icons/WrenchIcon'
import { getBikeDisplayName } from '@/lib/bike'
import { useActiveBike } from '@/lib/hooks/useActiveBike'
import { useMaintenanceLogCount } from '@/lib/hooks/useMaintenanceLogCount'
import { formatRecordCount } from '@/lib/recordCount'

/**
 * サイドバー下部の「○○の記録」（Issue #575「05 画面案 ─ PC」愛車）
 *
 * @remarks
 * 給油・ツーリング・メンテナンスへの記録リンクは、これまで愛車ページ
 * （`BikeRecordLinks`）の中にしか無く、PCの綴じ代（サイドバー）からは
 * 到達できなかった。アクティブ車両に対する同じ導線をサイドバーにも出す。
 * 件数は `BikeRecordLinks` と同じ値（バイク一覧APIの `fuelLogCount` /
 * `touringCount`、メンテナンス一覧APIの件数）を使う。新しいAPIは追加しない。
 * 写真はIssue #575の決定で一般ユーザーへの開放を見送っているため含めない。
 * バイクを1台も登録していない場合は何も出さない。
 */
export function SidebarBikeRecordLinks() {
  const { activeBike, bikes } = useActiveBike()
  const maintenanceLogCount = useMaintenanceLogCount(
    activeBike?.myUserBikeId ?? null
  )

  if (bikes.length === 0 || !activeBike) return null

  const bikeId = activeBike.myUserBikeId
  const displayName = getBikeDisplayName(activeBike)

  const items = [
    {
      href: `/app/my-bike/${bikeId}/fuel-logs`,
      icon: <FuelIcon />,
      label: '給油履歴',
      count: formatRecordCount(activeBike.fuelLogCount),
    },
    {
      href: `/app/my-bike/${bikeId}/tourings`,
      icon: <TouringIcon />,
      label: 'ツーリング',
      count: formatRecordCount(activeBike.touringCount),
    },
    {
      href: `/app/my-bike/${bikeId}/maintenance-logs`,
      icon: <WrenchIcon />,
      label: 'メンテナンス',
      count: formatRecordCount(maintenanceLogCount),
    },
  ]

  return (
    <nav
      className={styles.records}
      aria-label={`${displayName}の記録`}
      data-testid="sidebar-bike-record-links"
    >
      <p className={styles.heading}>{displayName}の記録</p>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={styles.row}>
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
          <span className={styles.count}>{item.count}</span>
        </Link>
      ))}
    </nav>
  )
}
