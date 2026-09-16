'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseFuelLogList,
  FuelLogPeriod,
  SuccessResponse,
} from '@repo/shared-types'
import { FuelLedgerList } from './FuelLedgerList'
import styles from './FuelLedgerSection.module.css'
import { KeywordSearchBar } from '@/components/common/KeywordSearchBar'
import { authenticatedFetch } from '@/lib/api/client'

const PER_SIZE = 100

type SortKey = 'refueledAt' | 'mileage' | 'fuelEfficiency'

const SORT_ITEMS: { key: SortKey; label: string }[] = [
  { key: 'refueledAt', label: '日付' },
  { key: 'mileage', label: 'ODO' },
  { key: 'fuelEfficiency', label: '燃費' },
]

type Props = {
  bikeId: string
  /** グラフと共有する期間フィルタ（ページ側の `chartPeriod` をそのまま渡す） */
  period: FuelLogPeriod
  onEdit: (fuelLogId: string) => void
}

/**
 * 給油の台帳（PC版・全件、Issue #575「05 画面案 ─ PC」）
 *
 * @remarks
 * `/app/my-bike/{id}/fuel-logs` のPC幅（1024px以上）専用の一覧。
 * カードの縦1列（`FuelLogListSection`。`components/fuel-log/` 配下のため
 * 変更していない）をやめ、罫線区切りの台帳（行）にする。モバイル/タブレット幅は
 * 従来どおり `FuelLogListSection` を表示し、本コンポーネントはCSSで
 * 非表示にする（`fuel-logs/page.module.css` の `.desktopOnly`）。
 *
 * 並べ替え（日付・ODO・燃費）はクライアント側で行う。燃費はAPIの
 * `sort-by` が対応していない（都度算出値のため）ため、日付・ODOも含めて
 * 一律クライアント側ソートに統一した。期間フィルタは既存の
 * 給油履歴一覧APIの `period` パラメータをそのまま使い、新しいAPIは
 * 追加していない。
 */
export function FuelLedgerSection({ bikeId, period, onEdit }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('refueledAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [keyword, setKeyword] = useState('')

  const { data, isLoading, error } = useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/fuel-logs?sort-by=refueled-at&sort-order=desc&per-size=${PER_SIZE}&period=${period}${
          keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''
        }`
      : null,
    async (url: string) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || '給油履歴の取得に失敗しました'
        )
      }
      const json =
        (await response.json()) as SuccessResponse<ApiResponseFuelLogList>
      return json.data
    }
  )

  const sorted = useMemo(() => {
    const logs = data ?? []
    const copy = [...logs]

    copy.sort((a, b) => {
      if (sortBy === 'fuelEfficiency') {
        const av = a.fuelEfficiency
        const bv = b.fuelEfficiency
        // 燃費null（継ぎ足し・初回給油）は並べ替え方向によらず常に末尾へ
        if (av === null && bv === null) return 0
        if (av === null) return 1
        if (bv === null) return -1
        return sortOrder === 'asc' ? av - bv : bv - av
      }

      const av =
        sortBy === 'refueledAt' ? new Date(a.refueledAt).getTime() : a.mileage
      const bv =
        sortBy === 'refueledAt' ? new Date(b.refueledAt).getTime() : b.mileage
      return sortOrder === 'asc' ? av - bv : bv - av
    })

    return copy
  }, [data, sortBy, sortOrder])

  const handleSortClick = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  return (
    <section className={styles.section} data-testid="fuel-ledger-section">
      <div className={styles.toolbar}>
        <KeywordSearchBar
          placeholder="メモ・ツーリング名で検索"
          onSearch={setKeyword}
          testId="fuel-ledger-search"
        />

        <div className={styles.sortRow} role="group" aria-label="並べ替え">
          {SORT_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={
                sortBy === item.key ? styles.sortBtnActive : styles.sortBtn
              }
              onClick={() => handleSortClick(item.key)}
            >
              {item.label}
              {sortBy === item.key ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className={styles.loading}>読み込み中...</p>
      ) : error ? (
        <p className={styles.loading}>給油履歴の取得に失敗しました</p>
      ) : (
        <FuelLedgerList
          fuelLogs={sorted}
          onSelect={onEdit}
          emptyMessage="該当する給油履歴が見つかりませんでした"
        />
      )}
    </section>
  )
}
