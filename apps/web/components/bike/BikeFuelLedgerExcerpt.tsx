'use client'

import Link from 'next/link'
import { useState } from 'react'
import { mutate } from 'swr'
import type {
  ApiResponseFuelLogDetail,
  FuelLogPeriod,
} from '@repo/shared-types'
import styles from './BikeFuelLedgerExcerpt.module.css'
import { FuelLedgerList } from './FuelLedgerList'
import { FuelLogEditModal } from '@/components/fuel-log/FuelLogEditModal'
import { BIKE_CARTE_PERIOD_FETCH_SIZE } from '@/lib/statics'

const EXCERPT_COUNT = 5

type Props = {
  bikeId: string
  period: FuelLogPeriod
  /** 期間・満タンフィルタ適用後の給油履歴（日付昇順） */
  fuelLogs: ApiResponseFuelLogDetail[]
}

/**
 * 愛車のカルテ内の「給油の台帳」抜粋（Issue #575「05 画面案 ─ PC」愛車）
 *
 * @remarks
 * 直近 {@link EXCERPT_COUNT} 件のみを表示し、「すべて見る →」で
 * `/app/my-bike/{id}/fuel-logs`（PC版の全件台帳）へ遷移する。
 * リンク文言は `components/RecentHistorySection.tsx`（ホームの記帳）と揃えている。
 * 行をクリックすると既存の `FuelLogEditModal`（`components/fuel-log/`。
 * 変更はしていない）を開いて編集できる。
 */
export function BikeFuelLedgerExcerpt({ bikeId, period, fuelLogs }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const recent = [...fuelLogs].reverse().slice(0, EXCERPT_COUNT)

  const revalidate = () => {
    void mutate(
      `/api/v1/user-bike/bike/${bikeId}/fuel-logs?sort-by=refueled-at&sort-order=asc&per-size=${BIKE_CARTE_PERIOD_FETCH_SIZE}&period=${period}`
    )
    void mutate(`/api/v1/user-bike/bike/${bikeId}`)
  }

  return (
    <section className={styles.section} data-testid="bike-fuel-ledger-excerpt">
      {editingId && (
        <FuelLogEditModal
          bikeId={bikeId}
          fuelLogId={editingId}
          onClose={() => setEditingId(null)}
          onSuccess={() => {
            setEditingId(null)
            revalidate()
          }}
        />
      )}

      <div className={styles.head}>
        <h2 className={styles.title}>給油の台帳</h2>
        <Link href={`/app/my-bike/${bikeId}/fuel-logs`} className={styles.more}>
          すべて見る →
        </Link>
      </div>

      <FuelLedgerList
        fuelLogs={recent}
        onSelect={setEditingId}
        emptyMessage="この期間の給油記録がありません"
      />
    </section>
  )
}
