'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ApiResponseMaintenanceScheduleItem } from '@repo/shared-types'
import styles from './MaintenanceScheduleSection.module.css'
import { useMaintenanceSchedule } from '@/lib/hooks/useMaintenanceSchedule'

const DISPLAY_COUNT = 3
// NO_RECORD/NO_INTERVAL を除いた「算出できた項目」を確実に3件集められるよう、
// 少し多めに取得してからクライアント側で絞り込む
const FETCH_LIMIT = 6

type Props = {
  bikeId: string
}

/**
 * 点検予定の1行分の表記を組み立てる
 *
 * @remarks
 * `basis` が MILEAGE なら残り走行距離、PERIOD なら残り日数を主役にする。
 * 超過（OVERDUE）の場合は「あと」ではなく「◯超過」に言い換え、
 * マイナス表記に頼らず一目で分かるようにする。
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
 * 点検の予定（Issue #575「04 画面案」c）
 *
 * @remarks
 * 既存の点検予定API（`GET /bike/{id}/maintenance-schedule`）を使い、
 * 残りが少ない順に2〜3件だけ表示する。整備記録が無い（NO_RECORD）・
 * マスタに推奨間隔が無い（NO_INTERVAL）項目は算出根拠が無く、
 * 推測で「あと◯km」を出すと誤解を招くためここには出さない
 * （全項目はメンテナンス履歴画面のリンクから確認できる）。
 *
 * データ取得中・取得エラー時はセクションごと出さない
 * （空カード・エラー表示・スケルトンは作らない）。
 */
export function MaintenanceScheduleSection({ bikeId }: Props) {
  const { data, error } = useMaintenanceSchedule(bikeId, FETCH_LIMIT)

  if (error || data === undefined) return null

  const items = data
    .filter(
      (item) => item.status !== 'NO_RECORD' && item.status !== 'NO_INTERVAL'
    )
    .slice(0, DISPLAY_COUNT)

  return (
    <section
      className={styles.section}
      data-testid="maintenance-schedule-section"
    >
      <h2 className={styles.title}>点検の予定</h2>

      {items.length === 0 ? (
        <p className={styles.empty}>
          点検記録がまだありません。整備を記録すると、次回の目安がここに表示されます。
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.type} className={styles.row}>
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
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/app/my-bike/${bikeId}/maintenance-logs`}
        className={styles.footerLink}
      >
        メンテナンス履歴を見る
        <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
      </Link>
    </section>
  )
}
