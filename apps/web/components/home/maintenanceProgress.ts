import type { ApiResponseMaintenanceScheduleItem } from '@repo/shared-types'

/**
 * 点検予定1件の進捗率（0〜1）を算出する
 *
 * @remarks
 * Issue #575「05 画面案 ─ PC」の「点検の予定」バー表示で使う。
 * `GET /bike/{id}/maintenance-schedule` は残り distance/日数のみを返し、
 * 推奨間隔そのもの（マスタ値）は含まない。新しいAPIは作らない方針のため、
 * `MaintenanceScheduleCalculationService` の算出式を逆算し、
 * 既存のレスポンス値だけから進捗率を復元する。
 *
 * - MILEAGE: `remainingMileage = (lastRecord.mileage + interval) - currentMileage`
 *   なので `interval = remainingMileage + (currentMileage - lastRecord.mileage)`。
 *   進捗率 = 経過距離 ÷ interval。
 * - PERIOD: `dueDate = lastRecord.performedAt + interval`
 *   なので 進捗率 = 経過日数 ÷ (dueDate - lastRecord.performedAt)。
 *
 * 算出に必要な値が欠けている場合（記録なし等）は null を返す。
 * 進捗率は表示用に 0〜1 にクランプする（超過時にバーが100%を超えて伸びないように）。
 */
export function computeMaintenanceProgressRatio(
  item: ApiResponseMaintenanceScheduleItem,
  currentMileage: number | null,
  now: Date
): number | null {
  if (!item.lastRecord) return null

  if (
    item.basis === 'MILEAGE' &&
    item.remainingMileage !== null &&
    currentMileage !== null
  ) {
    const elapsed = currentMileage - item.lastRecord.mileage
    const interval = elapsed + item.remainingMileage
    if (interval <= 0) return 1
    return Math.min(1, Math.max(0, elapsed / interval))
  }

  if (item.basis === 'PERIOD' && item.dueDate !== null) {
    const lastRecordedAt = new Date(item.lastRecord.performedAt).getTime()
    const totalMs = new Date(item.dueDate).getTime() - lastRecordedAt
    const elapsedMs = now.getTime() - lastRecordedAt
    if (totalMs <= 0) return 1
    return Math.min(1, Math.max(0, elapsedMs / totalMs))
  }

  return null
}
