'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseTouringList,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { TouringLedgerList } from './TouringLedgerList'
import styles from './TouringLedgerSection.module.css'
import { KeywordSearchBar } from '@/components/common/KeywordSearchBar'
import { authenticatedFetch } from '@/lib/api/client'

type SortKey = 'startDate' | 'distance'

const SORT_ITEMS: { key: SortKey; label: string }[] = [
  { key: 'startDate', label: '日付' },
  { key: 'distance', label: '距離' },
]

type Props = {
  bikeId: string
  onSelect: (touringId: string) => void
}

/**
 * ツーリングの台帳（PC版・全件、Issue #575「05 画面案 ─ PC」）
 *
 * @remarks
 * `/app/my-bike/{id}/tourings` のPC幅（1024px以上）専用の一覧。
 * カードの縦1列（`TouringListSection`。`components/touring/` 配下のため
 * 変更していない）をやめ、罫線区切りの台帳（行）にする。モバイル/タブレット幅は
 * 従来どおり `TouringListSection` を表示し、本コンポーネントはCSSで
 * 非表示にする（`tourings/page.module.css` の `.desktopOnly`）。
 *
 * ツーリング一覧APIはページネーションを持たない（全件返却）ため、
 * `FuelLedgerSection` と異なり件数指定なしで取得する。並べ替え（日付・距離）は
 * `FuelLedgerSection` と同じくクライアント側で行う。
 */
export function TouringLedgerSection({ bikeId, onSelect }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('startDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [keyword, setKeyword] = useState('')

  const { data, isLoading, error } = useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/tourings?sort-by=start-date&sort-order=desc${
          keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''
        }`
      : null,
    async (url: string) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || 'ツーリング履歴の取得に失敗しました'
        )
      }
      const json =
        (await response.json()) as SuccessResponse<ApiResponseTouringList>
      return json.data
    }
  )

  const sorted = useMemo(() => {
    const tourings = data ?? []
    const copy = [...tourings]

    copy.sort((a, b) => {
      if (sortBy === 'distance') {
        const av =
          a.startMileage !== null && a.endMileage !== null
            ? a.endMileage - a.startMileage
            : null
        const bv =
          b.startMileage !== null && b.endMileage !== null
            ? b.endMileage - b.startMileage
            : null
        // 距離未記録は並べ替え方向によらず常に末尾へ
        if (av === null && bv === null) return 0
        if (av === null) return 1
        if (bv === null) return -1
        return sortOrder === 'asc' ? av - bv : bv - av
      }

      const av = new Date(a.startDate).getTime()
      const bv = new Date(b.startDate).getTime()
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
    <section className={styles.section} data-testid="touring-ledger-section">
      <div className={styles.toolbar}>
        <KeywordSearchBar
          placeholder="タイトルで検索"
          onSearch={setKeyword}
          testId="touring-ledger-search"
        />

        <div className={styles.sortRow} role="group" aria-label="並べ替え">
          {SORT_ITEMS.map((item) => (
            <Button
              key={item.key}
              type="button"
              variant="quiet"
              size="sm"
              pill
              aria-pressed={sortBy === item.key}
              onClick={() => handleSortClick(item.key)}
            >
              {item.label}
              {sortBy === item.key ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className={styles.loading}>読み込み中...</p>
      ) : error ? (
        <p className={styles.loading}>ツーリング履歴の取得に失敗しました</p>
      ) : (
        <TouringLedgerList
          tourings={sorted}
          onSelect={onSelect}
          emptyMessage="該当するツーリングが見つかりませんでした"
        />
      )}
    </section>
  )
}
