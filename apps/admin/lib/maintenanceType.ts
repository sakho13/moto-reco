export const MAINTENANCE_TYPE_OPTIONS = [
  { value: 'BRAKE_FLUID', label: 'ブレーキフルード' },
  { value: 'FRONT_BRAKE_PAD', label: 'フロントブレーキパッド' },
  { value: 'REAR_BRAKE_PAD', label: 'リアブレーキパッド' },
  { value: 'MASTER_CYLINDER_CUP', label: 'マスターシリンダーカップ' },
  { value: 'BRAKE_CALIPER_SEAL', label: 'ブレーキキャリパーシール' },
  { value: 'BRAKE_CABLE', label: 'ブレーキケーブル' },
  { value: 'SPARK_PLUG', label: 'スパークプラグ' },
  { value: 'COOLANT', label: 'クーラント' },
  { value: 'ENGINE_OIL', label: 'エンジンオイル' },
  { value: 'OIL_CLEANER', label: 'オイルフィルター' },
  { value: 'TRANSMISSION_OIL', label: 'トランスミッションオイル' },
  { value: 'DRIVE_CHAIN', label: 'ドライブチェーン' },
  { value: 'DRIVE_BELT', label: 'ドライブベルト' },
  { value: 'FRONT_TIRE', label: 'フロントタイヤ' },
  { value: 'REAR_TIRE', label: 'リアタイヤ' },
  { value: 'BATTERY', label: 'バッテリー' },
  { value: 'LIGHT', label: 'ライト' },
  { value: 'TURN_SIGNAL', label: 'ウインカー' },
  { value: 'HORN', label: 'ホーン' },
] as const

export type MaintenanceTypeValue =
  (typeof MAINTENANCE_TYPE_OPTIONS)[number]['value']

export function isMaintenanceType(
  value: string
): value is MaintenanceTypeValue {
  return MAINTENANCE_TYPE_OPTIONS.some((option) => option.value === value)
}

export function getMaintenanceTypeLabel(value: string): string {
  return (
    MAINTENANCE_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  )
}
