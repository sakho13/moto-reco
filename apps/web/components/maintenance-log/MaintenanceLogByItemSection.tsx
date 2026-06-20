'use client'

import type { ApiResponseMaintenanceLogDetail } from '@repo/shared-types'
import { formatDate } from '@repo/shared-utils'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import styles from './MaintenanceLogByItemSection.module.css'
import { MAINTENANCE_ITEMS_MASTER } from '@/lib/api/server/constants/maintenanceItems'

type ItemHistory = {
  performedAt: string
  mileage: number
  maintenanceLogId: string
}

type MaintenanceLogByItemSectionProps = {
  logs: ApiResponseMaintenanceLogDetail[]
  currentMileage?: number
  onRegister: () => void
}

const CATEGORY_ORDER = ['BRAKE', 'ENGINE', 'TRANSMISSION', 'TIRE', 'ELECTRIC']

const CATEGORY_LABELS: Record<string, string> = {
  BRAKE: 'ブレーキ装置',
  ENGINE: 'エンジン',
  TRANSMISSION: '動力伝達装置',
  TIRE: 'タイヤ',
  ELECTRIC: '電気装置',
}

const buildItemHistoryMap = (
  logs: ApiResponseMaintenanceLogDetail[]
): Map<string, ItemHistory[]> => {
  const map = new Map<string, ItemHistory[]>()
  const sorted = [...logs].sort(
    (a, b) =>
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  )
  for (const log of sorted) {
    for (const item of log.items) {
      const list = map.get(item.maintenanceType) ?? []
      list.push({
        performedAt: log.performedAt,
        mileage: log.mileage,
        maintenanceLogId: log.maintenanceLogId,
      })
      map.set(item.maintenanceType, list)
    }
  }
  return map
}

const getRemainingMileage = (
  lastMileage: number,
  interval: number,
  currentMileage: number
): number => lastMileage + interval - currentMileage

const formatRecommendedInterval = (
  mileageInterval: number | null,
  periodMonths: number | null
): string | null => {
  const parts: string[] = []
  if (mileageInterval !== null)
    parts.push(`${mileageInterval.toLocaleString()}km毎`)
  if (periodMonths !== null) parts.push(`${periodMonths}ヶ月毎`)
  return parts.length > 0 ? parts.join(' / ') : null
}

export const MaintenanceLogByItemSection = ({
  logs,
  currentMileage,
  onRegister,
}: MaintenanceLogByItemSectionProps) => {
  const historyMap = buildItemHistoryMap(logs)

  const categories = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    items: MAINTENANCE_ITEMS_MASTER.filter((item) => item.category === cat),
  }))

  return (
    <BaseCard title="項目別メンテナンス状況">
      {logs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>メンテナンス履歴がまだありません</p>
          <Button onClick={onRegister} variant="primary">
            最初のメンテナンスを登録
          </Button>
        </div>
      ) : (
        <div className={styles.categoryList}>
          {categories.map(({ category, label, items }) => (
            <div key={category} className={styles.categorySection}>
              <p className={styles.categoryLabel}>{label}</p>
              <div className={styles.itemList}>
                {items.map((masterItem) => {
                  const history = historyMap.get(masterItem.type)
                  const latest = history?.[0]

                  const overMileage =
                    currentMileage !== undefined &&
                    latest &&
                    masterItem.recommendedMileageInterval !== null
                      ? currentMileage - latest.mileage >
                        masterItem.recommendedMileageInterval
                      : false

                  const recommendedInterval = formatRecommendedInterval(
                    masterItem.recommendedMileageInterval,
                    masterItem.recommendedPeriodMonths
                  )

                  const remainingKm =
                    currentMileage !== undefined &&
                    latest &&
                    masterItem.recommendedMileageInterval !== null
                      ? getRemainingMileage(
                          latest.mileage,
                          masterItem.recommendedMileageInterval,
                          currentMileage
                        )
                      : null

                  return (
                    <div
                      key={masterItem.type}
                      className={`${styles.itemRow} ${overMileage ? styles.overdue : ''}`}
                    >
                      <div className={styles.itemName}>
                        {masterItem.typeName}
                        {overMileage && (
                          <span className={styles.overdueTag}>要確認</span>
                        )}
                      </div>
                      <div className={styles.itemDetail}>
                        {latest ? (
                          <>
                            <span className={styles.lastDate}>
                              最終: {formatDate(latest.performedAt)}
                              <span className={styles.lastMileage}>
                                ({latest.mileage.toLocaleString()}km)
                              </span>
                            </span>
                            {remainingKm !== null && remainingKm > 0 && (
                              <span className={styles.remainingMileage}>
                                あと {remainingKm.toLocaleString()} km
                              </span>
                            )}
                            {recommendedInterval !== null && (
                              <span className={styles.recommendedInterval}>
                                推奨: {recommendedInterval}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className={styles.noRecord}>記録なし</span>
                            {recommendedInterval !== null && (
                              <span className={styles.recommendedInterval}>
                                推奨: {recommendedInterval}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </BaseCard>
  )
}
