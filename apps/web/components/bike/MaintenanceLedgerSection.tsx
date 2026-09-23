'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseMaintenanceLogList,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { MaintenanceLedgerList } from './MaintenanceLedgerList'
import styles from './MaintenanceLedgerSection.module.css'
import { KeywordSearchBar } from '@/components/common/KeywordSearchBar'
import { authenticatedFetch } from '@/lib/api/client'

const PER_SIZE = 100

type SortKey = 'performedAt' | 'mileage'

const SORT_ITEMS: { key: SortKey; label: string }[] = [
  { key: 'performedAt', label: '日付' },
  { key: 'mileage', label: 'ODO' },
]

type Props = {
  bikeId: string
  onSelect: (maintenanceLogId: string) => void
}

/**
 * メンテナンス履歴の台帳（PC版・日付順、Issue #575「05 画面案 ─ PC」）
 *
 * @remarks
 * `/app/my-bike/{id}/maintenance-logs` のPC幅（1024px以上）専用の一覧
 * （日付順ビュー）。カードの縦1列（`MaintenanceLogListSection`。
 * `components/maintenance-log/` 配下のため変更していない）をやめ、
 * 罫線区切りの台帳（行）にする。モバイル/タブレット幅は従来どおり
 * `MaintenanceLogListSection` を表示し、本コンポーネントはCSSで非表示にする
 * （`maintenance-logs/page.module.css` の `.desktopOnly`）。
 *
 * `FuelLedgerSection` と同じく全件（最大100件）を取得し、並べ替え（日付・ODO）は
 * クライアント側で行う。
 */
export function MaintenanceLedgerSection({ bikeId, onSelect }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('performedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [keyword, setKeyword] = useState('')

  const { data, isLoading, error } = useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/maintenance-logs?sort-order=desc&per-size=${PER_SIZE}${
          keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''
        }`
      : null,
    async (url: string) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || 'メンテナンス履歴の取得に失敗しました'
        )
      }
      const json =
        (await response.json()) as SuccessResponse<ApiResponseMaintenanceLogList>
      return json.data
    }
  )

  const sorted = useMemo(() => {
    const logs = data ?? []
    const copy = [...logs]

    copy.sort((a, b) => {
      const av =
        sortBy === 'performedAt' ? new Date(a.performedAt).getTime() : a.mileage
      const bv =
        sortBy === 'performedAt' ? new Date(b.performedAt).getTime() : b.mileage
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
    <section
      className={styles.section}
      data-testid="maintenance-ledger-section"
    >
      <div className={styles.toolbar}>
        <KeywordSearchBar
          placeholder="メモで検索"
          onSearch={setKeyword}
          testId="maintenance-ledger-search"
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
        <p className={styles.loading}>メンテナンス履歴の取得に失敗しました</p>
      ) : (
        <MaintenanceLedgerList
          logs={sorted}
          onSelect={onSelect}
          emptyMessage="該当するメンテナンス履歴が見つかりませんでした"
        />
      )}
    </section>
  )
}
