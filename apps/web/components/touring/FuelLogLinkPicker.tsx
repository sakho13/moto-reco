'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWRInfinite from 'swr/infinite'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseFuelLogList,
  SuccessResponse,
} from '@repo/shared-types'
import { formatDateTime } from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import styles from './FuelLogLinkPicker.module.css'
import { authenticatedFetch } from '@/lib/api/client'

const PAGE_SIZE = 10

export interface FuelLogLinkPickerProps {
  /**
   * 対象バイクのID
   */
  bikeId: string
  /**
   * 編集中のツーリングID（付け替え判定に使用）
   */
  currentTouringId: string
  /**
   * 初期選択済みの給油履歴ID一覧
   */
  initialSelectedIds: string[]
  /**
   * 「期間内のみ表示」時の検索開始日時（ISO文字列）
   */
  defaultStartDate: string
  /**
   * 「期間内のみ表示」時の検索終了日時（ISO文字列）
   */
  defaultEndDate: string
  /**
   * 選択状態が変化した際のコールバック
   */
  onChange: (selectedIds: string[]) => void
}

/**
 * ツーリングに紐づける給油履歴を検索・選択するピッカー
 *
 * @remarks
 * `GET /api/v1/user-bike/bike/:myUserBikeId/fuel-logs` を「もっと見る」形式でページングしながら取得し、
 * チェックボックスで複数選択できるようにする。
 * 「期間内のみ表示」トグルがONの場合はツーリング期間（前後2時間）で絞り込み、
 * OFFの場合は全期間から検索できる。
 */
export const FuelLogLinkPicker = ({
  bikeId,
  currentTouringId,
  initialSelectedIds,
  defaultStartDate,
  defaultEndDate,
  onChange,
}: FuelLogLinkPickerProps) => {
  const [periodOnly, setPeriodOnly] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  )

  const fetchFuelLogs = async (url: string) => {
    const response = await authenticatedFetch(url, { method: 'GET' })
    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiV1Error(
        errorData.errorCode || 'SERVER_ERROR',
        errorData.message || 'エラーが発生しました'
      )
    }
    const json =
      (await response.json()) as SuccessResponse<ApiResponseFuelLogList>
    return json.data
  }

  const getKey = (pageIndex: number): string => {
    const params = new URLSearchParams({
      'sort-by': 'refueled-at',
      'sort-order': 'desc',
      'per-size': String(PAGE_SIZE),
      page: String(pageIndex + 1),
    })
    if (periodOnly) {
      params.set('startDate', defaultStartDate)
      params.set('endDate', defaultEndDate)
    }
    return `/api/v1/user-bike/bike/${bikeId}/fuel-logs?${params.toString()}`
  }

  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite(
    getKey,
    fetchFuelLogs
  )

  const fuelLogs = useMemo(
    () => (data ? data.filter(Boolean).flat() : []),
    [data]
  )
  const lastPageCount = data?.[data.length - 1]?.length ?? 0
  const canLoadMore = lastPageCount === PAGE_SIZE
  const isLoadingMore = isValidating && !isLoading && size > 0

  const handleToggle = (fuelLogId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(fuelLogId)) {
        next.delete(fuelLogId)
      } else {
        next.add(fuelLogId)
      }
      return next
    })
  }

  useEffect(() => {
    onChange(Array.from(selectedIds))
  }, [selectedIds, onChange])

  const handleTogglePeriodOnly = () => {
    setPeriodOnly((prev) => !prev)
    setSize(1)
  }

  return (
    <div className={styles.container} data-testid="fuel-log-link-picker">
      <div className={styles.header}>
        <p className={styles.title}>紐づける給油履歴</p>
        <Checkbox
          id="fuel-log-picker-period-only"
          label="期間内のみ表示"
          checked={periodOnly}
          onChange={handleTogglePeriodOnly}
        />
      </div>
      <p className={styles.note}>
        給油履歴を選択するとこのツーリングに紐づきます。既に別のツーリングに紐づいている給油履歴を選択すると、元のツーリングから自動的に解除されます。
      </p>

      {isLoading ? (
        <p className={styles.loading}>読み込み中...</p>
      ) : fuelLogs.length === 0 ? (
        <p className={styles.empty}>
          {periodOnly
            ? '期間内に給油履歴が見つかりません。「期間内のみ表示」を解除すると全件から検索できます。'
            : '給油履歴が見つかりません'}
        </p>
      ) : (
        <div className={styles.list}>
          {fuelLogs.map((fuelLog) => {
            const linkedToOtherTouring =
              fuelLog.touringId !== null &&
              fuelLog.touringId !== currentTouringId

            return (
              <div key={fuelLog.fuelLogId} className={styles.item}>
                <Checkbox
                  id={`fuel-log-picker-item-${fuelLog.fuelLogId}`}
                  label={`${formatDateTime(fuelLog.refueledAt)} ${fuelLog.mileage.toLocaleString()}km ${fuelLog.amount.toFixed(1)}L${fuelLog.memo ? ` ${fuelLog.memo}` : ''}`}
                  checked={selectedIds.has(fuelLog.fuelLogId)}
                  onChange={() => handleToggle(fuelLog.fuelLogId)}
                />
                {linkedToOtherTouring && (
                  <span className={styles.badge}>
                    {fuelLog.touringTitle ?? '他のツーリング'}に紐づけ済み
                  </span>
                )}
              </div>
            )
          })}
          {canLoadMore && (
            <div className={styles.loadMore}>
              <Button
                onClick={() => setSize(size + 1)}
                variant="cloud"
                loading={isLoadingMore}
              >
                もっと見る
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
