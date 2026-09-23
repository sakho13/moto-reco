'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseFuelLogList,
  FuelLogPeriod,
  SuccessResponse,
} from '@repo/shared-types'
import { Select } from '@repo/ui/select'
import type { SelectOption } from '@repo/ui/select'
import { FuelLedgerList } from './FuelLedgerList'
import styles from './FuelLedgerSection.module.css'
import { KeywordSearchBar } from '@/components/common/KeywordSearchBar'
import { authenticatedFetch } from '@/lib/api/client'
import { FUEL_LOG_PERIOD_OPTIONS } from '@/lib/statics'

const PER_SIZE = 100

type SortKey = 'refueledAt' | 'mileage' | 'fuelEfficiency'

const SORT_ITEMS: { key: SortKey; label: string }[] = [
  { key: 'refueledAt', label: '日付' },
  { key: 'mileage', label: 'ODO' },
  { key: 'fuelEfficiency', label: '燃費' },
]

/** 台帳自身の期間フィルタ（グラフの期間フィルタとは独立） */
type LedgerPeriod = FuelLogPeriod | 'all'

// 「全期間」は台帳固有の選択肢のため先頭に追加し、それ以外は愛車カルテ
// （`BikeCarteControls`）と共通の `FUEL_LOG_PERIOD_OPTIONS` を単一の情報源にする
const PERIOD_OPTIONS: SelectOption[] = [
  { value: 'all', label: '全期間' },
  ...FUEL_LOG_PERIOD_OPTIONS,
]

type Props = {
  bikeId: string
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
 * 一律クライアント側ソートに統一した。
 *
 * 期間フィルタはグラフ（`chartPeriod`）とは独立させ、台帳自身が保持する
 * （既定値は「全期間」）。1024px以上ではモバイルの `FuelLogListSection`
 * （ページングで全履歴に到達できる）が非表示になり本コンポーネントだけが
 * 台帳を提供するため、グラフの期間（最長1年）と共有すると1年以上前の
 * 給油履歴にPC版から到達できなくなる不具合があった。既存の給油履歴一覧APIの
 * `period` パラメータをそのまま使い（`all` の場合は付与しない）、新しいAPIは
 * 追加していない。
 */
export function FuelLedgerSection({ bikeId, onEdit }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('refueledAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [keyword, setKeyword] = useState('')
  const [period, setPeriod] = useState<LedgerPeriod>('all')

  const { data, isLoading, error } = useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/fuel-logs?sort-by=refueled-at&sort-order=desc&per-size=${PER_SIZE}${
          period === 'all' ? '' : `&period=${period}`
        }${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`
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
        <div className={styles.filters}>
          <KeywordSearchBar
            placeholder="メモ・ツーリング名で検索"
            onSearch={setKeyword}
            testId="fuel-ledger-search"
          />
          <div className={styles.periodSelect}>
            <Select
              id="fuel-ledger-period"
              aria-label="期間"
              options={PERIOD_OPTIONS}
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as LedgerPeriod)
              }
            />
          </div>
        </div>

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
