'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ApiResponseMaintenanceScheduleItem } from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'
import { computeMaintenanceProgressRatio } from './maintenanceProgress'
import styles from './UpcomingMaintenanceRail.module.css'
import { useActiveBike } from '@/lib/hooks/useActiveBike'
import { useMaintenanceSchedule } from '@/lib/hooks/useMaintenanceSchedule'

const DISPLAY_COUNT = 3
// NO_RECORD/NO_INTERVAL を除いた「算出できた項目」を確実に集められるよう、
// 少し多めに取得してからクライアント側で絞り込む（MaintenanceScheduleSectionと同じ方針）
const FETCH_LIMIT = 6

/**
 * 点検予定1件分の「あと◯」表記を組み立てる
 *
 * @remarks
 * `components/bike/MaintenanceScheduleSection.tsx` と同じ表記ルール。
 */
function formatRemaining(item: ApiResponseMaintenanceScheduleItem): string {
  if (item.basis === 'MILEAGE' && item.remainingMileage !== null) {
    const value = Math.abs(item.remainingMileage).toLocaleString()
    return item.status === 'OVERDUE' ? `${value}km 超過` : `あと ${value}km`
  }
  if (item.basis === 'PERIOD' && item.remainingDays !== null) {
    const value = Math.abs(item.remainingDays).toLocaleString()
    return item.status === 'OVERDUE' ? `${value}日 超過` : `あと ${value}日`
  }
  return '—'
}

/**
 * ホーム「今日」見開き（PC）レールの「点検の予定」
 *
 * @remarks
 * Issue #575「05 画面案 ─ PC」。既存の点検予定API
 * （`GET /bike/{id}/maintenance-schedule`）を使い、残りが少ない順に2〜3件だけ
 * 残り距離のバー付きで表示する。バーの進捗率は新しいAPIを作らず
 * `computeMaintenanceProgressRatio` で既存のレスポンス値から逆算する。
 *
 * 記録が無い・推奨間隔が無い項目は算出根拠が無いため出さない
 * （`components/bike/MaintenanceScheduleSection.tsx` と同じ方針）。
 * データ取得中・取得エラー時・表示対象が無い場合はセクションごと出さない。
 * モバイルでは表示しない（PC専用）。
 */
export function UpcomingMaintenanceRail() {
  const { activeBike } = useActiveBike()
  const bikeId = activeBike?.myUserBikeId ?? null
  const { data, error } = useMaintenanceSchedule(bikeId, FETCH_LIMIT)

  if (error || data === undefined || !activeBike) return null

  const items = data
    .filter(
      (item) => item.status !== 'NO_RECORD' && item.status !== 'NO_INTERVAL'
    )
    .slice(0, DISPLAY_COUNT)

  if (items.length === 0) return null

  const now = getCurrentDate()

  return (
    <div className={styles.rail} data-testid="upcoming-maintenance-rail">
      <h2 className={styles.title}>点検の予定</h2>

      <ul className={styles.list}>
        {items.map((item) => {
          const ratio = computeMaintenanceProgressRatio(
            item,
            activeBike.totalMileage,
            now
          )
          const barClass =
            item.status === 'OVERDUE'
              ? styles.barOverdue
              : item.status === 'UPCOMING'
                ? styles.barUpcoming
                : styles.barOk

          return (
            <li key={item.type} className={styles.row}>
              <div className={styles.rowHead}>
                <span className={styles.name}>{item.typeName}</span>
                <span
                  className={
                    item.status === 'OVERDUE'
                      ? styles.remainingOverdue
                      : item.status === 'UPCOMING'
                        ? styles.remainingUpcoming
                        : styles.remaining
                  }
                >
                  {formatRemaining(item)}
                </span>
              </div>
              {ratio !== null && (
                <div className={styles.bar}>
                  <span
                    className={barClass}
                    style={{ width: `${Math.round(ratio * 100)}%` }}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <Link
        href={`/app/my-bike/${bikeId}/maintenance-logs`}
        className={styles.footerLink}
      >
        メンテナンス履歴を見る
        <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
  )
}
