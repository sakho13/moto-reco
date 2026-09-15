'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'
import type {
  ApiResponseMaintenanceLogList,
  ApiResponseUserGoodsList,
  SuccessResponse,
} from '@repo/shared-types'
import styles from './BikeRecordLinks.module.css'
import { FuelIcon } from '@/components/icons/FuelIcon'
import { GoodsIcon } from '@/components/icons/GoodsIcon'
import { TouringIcon } from '@/components/icons/TouringIcon'
import { WrenchIcon } from '@/components/icons/WrenchIcon'
import { authenticatedFetch } from '@/lib/api/client'

// 一覧APIは総件数を返さないため、上限いっぱい（100件）まで取得して件数の
// 近似値とする。`AttachedGoodsSection` / メンテナンス履歴画面の「項目別ビュー」で
// 使われているのと同じ回避策（新しいAPIは追加しない）
const COUNT_FETCH_SIZE = 100

type Props = {
  bikeId: string
  fuelLogCount: number
  touringCount: number
  isAdmin: boolean
}

/**
 * 件数取得中・取得失敗時は「—」を出す。0件確定時のみ「0件」と表示する
 */
function formatCount(count: number | undefined): string {
  if (count === undefined) return '—'
  return `${count.toLocaleString()}件`
}

function useMaintenanceLogCount(bikeId: string): number | undefined {
  const { data } = useSWR(
    `/api/v1/user-bike/bike/${bikeId}/maintenance-logs?per-size=${COUNT_FETCH_SIZE}`,
    async (url: string) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) throw new Error('failed')
      const json =
        (await response.json()) as SuccessResponse<ApiResponseMaintenanceLogList>
      return json.data.length
    }
  )
  return data
}

function useGoodsCount(bikeId: string, enabled: boolean): number | undefined {
  const { data } = useSWR(
    enabled
      ? `/api/v1/user-goods?myUserBikeId=${bikeId}&per-size=${COUNT_FETCH_SIZE}&page=1`
      : null,
    async (url: string) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) throw new Error('failed')
      const json =
        (await response.json()) as SuccessResponse<ApiResponseUserGoodsList>
      return json.data.length
    }
  )
  return data
}

/**
 * 記録へのリンク（Issue #575「04 画面案」d）
 *
 * @remarks
 * 説明文つきのナビゲーションカード3枚をやめ、件数付きの行リストにする。
 * 写真は出さない（BikePhotosCardは管理者のみ現状維持のまま、この行リストには含めない）。
 */
export function BikeRecordLinks({
  bikeId,
  fuelLogCount,
  touringCount,
  isAdmin,
}: Props) {
  const maintenanceLogCount = useMaintenanceLogCount(bikeId)
  const goodsCount = useGoodsCount(bikeId, isAdmin)

  const items = [
    {
      href: `/app/my-bike/${bikeId}/fuel-logs`,
      icon: <FuelIcon />,
      label: '給油履歴',
      count: formatCount(fuelLogCount),
    },
    {
      href: `/app/my-bike/${bikeId}/tourings`,
      icon: <TouringIcon />,
      label: 'ツーリング',
      count: formatCount(touringCount),
    },
    {
      href: `/app/my-bike/${bikeId}/maintenance-logs`,
      icon: <WrenchIcon />,
      label: 'メンテナンス',
      count: formatCount(maintenanceLogCount),
    },
    ...(isAdmin
      ? [
          {
            href: `/app/my-bike/${bikeId}/goods`,
            icon: <GoodsIcon />,
            label: 'グッズ',
            count: formatCount(goodsCount),
          },
        ]
      : []),
  ]

  return (
    <nav className={styles.list} data-testid="bike-record-links">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={styles.row}>
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
          <span className={styles.count}>{item.count}</span>
          <ChevronRight
            className={styles.chevron}
            size={18}
            strokeWidth={2}
            aria-hidden="true"
          />
        </Link>
      ))}
    </nav>
  )
}
