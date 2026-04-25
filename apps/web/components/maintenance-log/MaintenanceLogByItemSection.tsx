'use client'

import type { ApiResponseMaintenanceLogDetail } from '@repo/shared-types'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { MAINTENANCE_ITEMS_MASTER } from '@/lib/api/server/constants/maintenanceItems'
import styles from './MaintenanceLogByItemSection.module.css'

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

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

const buildItemHistoryMap = (
  logs: ApiResponseMaintenanceLogDetail[]
): Map<string, ItemHistory[]> => {
  const map = new Map<string, ItemHistory[]>()
  const sorted = [...logs].sort(
    (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
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

const getNextMileage = (
  lastMileage: number,
  interval: number | null
): string | null => {
  if (interval === null) return null
  return `${(lastMileage + interval).toLocaleString()}km`
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
                            {masterItem.recommendedMileageInterval !== null && (
                              <span className={styles.nextInfo}>
                                次回目安:{' '}
                                {getNextMileage(
                                  latest.mileage,
                                  masterItem.recommendedMileageInterval
                                )}
                              </span>
                            )}
                            {masterItem.recommendedPeriodMonths !== null &&
                              masterItem.recommendedMileageInterval === null && (
                                <span className={styles.nextInfo}>
                                  推奨: {masterItem.recommendedPeriodMonths}ヶ月毎
                                </span>
                              )}
                          </>
                        ) : (
                          <span className={styles.noRecord}>記録なし</span>
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
