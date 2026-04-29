// メンテナンスカテゴリ（保険は別エンドポイントで管理）
export const MAINTENANCE_CATEGORIES = [
  'BRAKE', // ブレーキ装置
  'ENGINE', // エンジン
  'TRANSMISSION', // 動力伝達装置
  'TIRE', // タイヤ
  'ELECTRIC', // 電気装置
] as const

export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number]

// メンテナンスタイプ（保険は除外）
export const MAINTENANCE_TYPES = [
  // ブレーキ装置
  'BRAKE_FLUID',
  'FRONT_BRAKE_PAD',
  'REAR_BRAKE_PAD',
  'MASTER_CYLINDER_CUP',
  'BRAKE_CALIPER_SEAL',
  'BRAKE_CABLE',
  // エンジン
  'SPARK_PLUG',
  'COOLANT',
  'ENGINE_OIL',
  'OIL_CLEANER',
  // 動力伝達装置
  'TRANSMISSION_OIL',
  'DRIVE_CHAIN',
  'DRIVE_BELT',
  // タイヤ
  'FRONT_TIRE',
  'REAR_TIRE',
  // 電気装置
  'BATTERY',
  'LIGHT',
  'TURN_SIGNAL',
  'HORN',
] as const

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number]

// メンテナンス項目データ
export type MaintenanceItem = {
  id: string // ユニークID: {userBikeId}_{maintenanceType}
  type: MaintenanceType
  category: MaintenanceCategory
  typeName: string
  categoryName: string
  recommendedMileageInterval: number | null // 推奨走行距離間隔（km）
  recommendedPeriodMonths: number | null // 推奨期間間隔（月）
  description?: string
}

// API型定義
export type ApiResponseMaintenanceItems = {
  maintenanceItems: MaintenanceItem[]
}
