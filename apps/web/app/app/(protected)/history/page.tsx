'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import useSWRInfinite from 'swr/infinite'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseAllBikesHistoryList,
  SuccessResponse,
} from '@repo/shared-types'
import styles from './page.module.css'
import { FuelLogEditModal } from '@/components/fuel-log/FuelLogEditModal'
import { RecentRecordRow } from '@/components/home/RecentRecordRow'
import { authenticatedFetch } from '@/lib/api/client'
import {
  resolveSavedFuelLogEfficiencyReason,
  type SavedFuelLogReferenceEntry,
} from '@/lib/fuelLogSheet'
import { withAuth } from '@/lib/hoc/withAuth'

const PAGE_SIZE = 10

function HistoryPage() {
  const router = useRouter()
  const [editingFuelLog, setEditingFuelLog] = useState<{
    bikeId: string
    fuelLogId: string
  } | null>(null)

  const fetchHistory = async (url: string) => {
    const response = await authenticatedFetch(url, { method: 'GET' })
    if (!response.ok) {
      const errorData = await response.json()
      throw new ApiV1Error(
        errorData.errorCode || 'SERVER_ERROR',
        errorData.message || 'エラーが発生しました'
      )
    }
    const json =
      (await response.json()) as SuccessResponse<ApiResponseAllBikesHistoryList>
    return json.data
  }

  const { data, error, isLoading, size, setSize, isValidating } =
    useSWRInfinite(
      (pageIndex) =>
        `/api/v1/user-bike/history?per-size=${PAGE_SIZE}&page=${pageIndex + 1}`,
      fetchHistory
    )

  const historyItems = data ? data.flat() : []
  const lastPageCount = data?.[data.length - 1]?.length ?? 0
  const canLoadMore = lastPageCount === PAGE_SIZE
  const isLoadingMore = isValidating && !isLoading && size > 0

  // 「初回給油」／「前回が継ぎ足し」の判定は同一車両内でのmileage昇順の
  // 直前ログを見る必要があるため、車両ごとに分けたmileage昇順の給油ログ一覧を
  // 用意する（全車両横断ページのため、`RecentHistorySection` のように
  // 単一車両のフィルタ済みリストをそのまま使えない）。
  // ページング（1ページ10件）で対象より前のログが未取得の場合は、
  // `resolveSavedFuelLogEfficiencyReason` の仕様どおり「初回給油」側に
  // フォールバックする。
  const fuelLogsByBikeMileageAsc = useMemo(() => {
    const map = new Map<string, SavedFuelLogReferenceEntry[]>()
    for (const item of historyItems) {
      if (item.type !== 'FUEL_LOG') continue
      const list = map.get(item.bikeId) ?? []
      list.push(item.fuelLog)
      map.set(item.bikeId, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.mileage - b.mileage)
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!sentinelRef.current || !canLoadMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore) {
          setSize((s) => s + 1)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [canLoadMore, isLoadingMore, setSize])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>ヒストリー</h1>
      </div>

      {isLoading ? (
        <p className={styles.empty}>読み込み中...</p>
      ) : error ? (
        <div className={styles.errorBox}>
          <p className={styles.errorMessage}>
            {error instanceof ApiV1Error
              ? error.message
              : 'ヒストリーの取得に失敗しました'}
          </p>
        </div>
      ) : historyItems.length > 0 ? (
        <div className={styles.list}>
          {historyItems.map((item) => (
            <RecentRecordRow
              key={`${item.type}-${item.occurredAt}-${item.type === 'FUEL_LOG' ? item.fuelLog.fuelLogId : item.touring.touringId}`}
              item={item}
              bikeName={item.bikeName}
              efficiencyUnavailableReason={
                item.type === 'FUEL_LOG'
                  ? resolveSavedFuelLogEfficiencyReason(
                      fuelLogsByBikeMileageAsc.get(item.bikeId) ?? [],
                      item.fuelLog.fuelLogId
                    )
                  : undefined
              }
              onClick={
                item.type === 'FUEL_LOG'
                  ? () =>
                      setEditingFuelLog({
                        bikeId: item.bikeId,
                        fuelLogId: item.fuelLog.fuelLogId,
                      })
                  : item.type === 'TOURING'
                    ? () =>
                        router.push(
                          `/app/my-bike/${item.bikeId}/tourings/${item.touring.touringId}`
                        )
                    : undefined
              }
            />
          ))}
          <div ref={sentinelRef} />
          {isLoadingMore && <p className={styles.loadingMore}>読み込み中...</p>}
        </div>
      ) : (
        <p className={styles.empty}>ヒストリーはまだありません</p>
      )}

      {editingFuelLog && (
        <FuelLogEditModal
          bikeId={editingFuelLog.bikeId}
          fuelLogId={editingFuelLog.fuelLogId}
          onClose={() => setEditingFuelLog(null)}
          onSuccess={() => {
            setEditingFuelLog(null)
            setSize(1)
          }}
        />
      )}
    </div>
  )
}

export default withAuth(HistoryPage)
