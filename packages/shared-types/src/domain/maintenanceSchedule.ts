import { MaintenanceCategory, MaintenanceType } from './maintenance'

/**
 * 点検予定の算出において採用された基準
 *
 * - MILEAGE: 走行距離ベース（直近の該当整備記録のODO + 推奨走行距離間隔）
 * - PERIOD: 期間ベース（直近の実施日 + 推奨期間間隔）
 */
export const MAINTENANCE_SCHEDULE_BASES = ['MILEAGE', 'PERIOD'] as const

export type MaintenanceScheduleBasis =
  (typeof MAINTENANCE_SCHEDULE_BASES)[number]

/**
 * 点検予定のステータス
 *
 * - OVERDUE: 推奨間隔を超過している（余裕あり／まもなくの逆）
 * - UPCOMING: まもなく推奨間隔に到達する
 * - OK: 余裕がある
 * - NO_RECORD: 該当するメンテナンス項目の整備記録が1件も存在しない
 * - NO_INTERVAL: マスタに走行距離・期間いずれの推奨間隔も設定されていない
 */
export const MAINTENANCE_SCHEDULE_STATUSES = [
  'OVERDUE',
  'UPCOMING',
  'OK',
  'NO_RECORD',
  'NO_INTERVAL',
] as const

export type MaintenanceScheduleStatus =
  (typeof MAINTENANCE_SCHEDULE_STATUSES)[number]

/**
 * 点検予定の算出根拠となった直近の整備記録
 */
export type MaintenanceScheduleLastRecord = {
  performedAt: Date
  mileage: number
}

/**
 * メンテナンス項目1件分の点検予定
 */
export type MaintenanceScheduleForecast = {
  type: MaintenanceType
  category: MaintenanceCategory
  typeName: string
  categoryName: string
  /** 採用した基準。算出不能（記録なし・推奨間隔未設定）の場合は null */
  basis: MaintenanceScheduleBasis | null
  /** 残り走行距離（km）。basisが MILEAGE の場合のみ non-null。超過時は負値 */
  remainingMileage: number | null
  /** 次回予定日。basisが PERIOD の場合のみ non-null */
  dueDate: Date | null
  /** 次回予定日までの残り日数。basisが PERIOD の場合のみ non-null。超過時は負値 */
  remainingDays: number | null
  /** 算出根拠となった直近の整備記録。記録がない場合は null */
  lastRecord: MaintenanceScheduleLastRecord | null
  status: MaintenanceScheduleStatus
}
