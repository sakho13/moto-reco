import { MaintenanceItem } from '@repo/shared-types'

// idを除いた型を定義
type MaintenanceItemWithoutId = Omit<MaintenanceItem, 'id'>

/**
 * メンテナンス項目マスタデータ（固定値）
 *
 * 各メンテナンス項目の推奨交換タイミングを定義
 * - recommendedMileageInterval: 走行距離ベースの推奨間隔（km）
 * - recommendedPeriodMonths: 時間ベースの推奨間隔（月）
 *
 * null の場合は該当する推奨間隔がないことを示す
 *
 * 注意: idフィールドはサービス層で動的に追加されます
 */
export const MAINTENANCE_ITEMS_MASTER: readonly MaintenanceItemWithoutId[] = [
  // ブレーキ装置
  {
    type: 'BRAKE_FLUID',
    category: 'BRAKE',
    typeName: 'ブレーキ液',
    categoryName: 'ブレーキ装置',
    recommendedMileageInterval: null,
    recommendedPeriodMonths: 24,
    description: 'ブレーキの作動に必要な液体。吸湿性があるため定期交換が必要',
  },
  {
    type: 'FRONT_BRAKE_PAD',
    category: 'BRAKE',
    typeName: 'フロントブレーキパッド',
    categoryName: 'ブレーキ装置',
    recommendedMileageInterval: 10000,
    recommendedPeriodMonths: null,
    description: '前輪の制動力を生み出す消耗部品',
  },
  {
    type: 'REAR_BRAKE_PAD',
    category: 'BRAKE',
    typeName: 'リアブレーキパッド',
    categoryName: 'ブレーキ装置',
    recommendedMileageInterval: 15000,
    recommendedPeriodMonths: null,
    description: '後輪の制動力を生み出す消耗部品',
  },
  {
    type: 'MASTER_CYLINDER_CUP',
    category: 'BRAKE',
    typeName: 'マスタシリンダカップ',
    categoryName: 'ブレーキ装置',
    recommendedMileageInterval: null,
    recommendedPeriodMonths: 24,
    description: 'ブレーキマスターシリンダー内のシール部品',
  },
  {
    type: 'BRAKE_CALIPER_SEAL',
    category: 'BRAKE',
    typeName: 'キャリパシール',
    categoryName: 'ブレーキ装置',
    recommendedMileageInterval: null,
    recommendedPeriodMonths: 24,
    description: 'ブレーキキャリパー内のシール部品',
  },
  {
    type: 'BRAKE_CABLE',
    category: 'BRAKE',
    typeName: 'ブレーキケーブル',
    categoryName: 'ブレーキ装置',
    recommendedMileageInterval: null,
    recommendedPeriodMonths: 24,
    description: 'ブレーキレバーの操作を伝達するケーブル',
  },

  // エンジン
  {
    type: 'SPARK_PLUG',
    category: 'ENGINE',
    typeName: 'スパークプラグ',
    categoryName: 'エンジン',
    recommendedMileageInterval: 10000,
    recommendedPeriodMonths: null,
    description: '燃焼室で火花を発生させる部品',
  },
  {
    type: 'COOLANT',
    category: 'ENGINE',
    typeName: '冷却水',
    categoryName: 'エンジン',
    recommendedMileageInterval: null,
    recommendedPeriodMonths: 24,
    description: 'エンジンを冷却するための液体',
  },
  {
    type: 'ENGINE_OIL',
    category: 'ENGINE',
    typeName: 'エンジンオイル',
    categoryName: 'エンジン',
    recommendedMileageInterval: 3000,
    recommendedPeriodMonths: 6,
    description: 'エンジンの潤滑と冷却を担う重要なオイル',
  },
  {
    type: 'OIL_CLEANER',
    category: 'ENGINE',
    typeName: 'オイルクリーナー',
    categoryName: 'エンジン',
    recommendedMileageInterval: 6000,
    recommendedPeriodMonths: 12,
    description: 'エンジンオイル内の不純物を除去するフィルター',
  },

  // 動力伝達装置
  {
    type: 'TRANSMISSION_OIL',
    category: 'TRANSMISSION',
    typeName: 'トランスミッションオイル',
    categoryName: '動力伝達装置',
    recommendedMileageInterval: 10000,
    recommendedPeriodMonths: 24,
    description: 'ミッション内部の潤滑を担うオイル',
  },
  {
    type: 'DRIVE_CHAIN',
    category: 'TRANSMISSION',
    typeName: 'ドライブチェーン',
    categoryName: '動力伝達装置',
    recommendedMileageInterval: 20000,
    recommendedPeriodMonths: null,
    description: 'エンジンの動力を後輪に伝達するチェーン',
  },
  {
    type: 'DRIVE_BELT',
    category: 'TRANSMISSION',
    typeName: 'ドライブベルト',
    categoryName: '動力伝達装置',
    recommendedMileageInterval: 30000,
    recommendedPeriodMonths: null,
    description: 'エンジンの動力を後輪に伝達するベルト（スクーター等）',
  },

  // タイヤ
  {
    type: 'FRONT_TIRE',
    category: 'TIRE',
    typeName: 'フロントタイヤ',
    categoryName: 'タイヤ',
    recommendedMileageInterval: 10000,
    recommendedPeriodMonths: 36,
    description: '前輪のタイヤ。摩耗や経年劣化で交換が必要',
  },
  {
    type: 'REAR_TIRE',
    category: 'TIRE',
    typeName: 'リアタイヤ',
    categoryName: 'タイヤ',
    recommendedMileageInterval: 8000,
    recommendedPeriodMonths: 36,
    description: '後輪のタイヤ。駆動輪のため前輪より摩耗が早い',
  },

  // 電気装置
  {
    type: 'BATTERY',
    category: 'ELECTRIC',
    typeName: 'バッテリー',
    categoryName: '電気装置',
    recommendedMileageInterval: null,
    recommendedPeriodMonths: 24,
    description: '電装系に電力を供給するバッテリー',
  },
  {
    type: 'LIGHT',
    category: 'ELECTRIC',
    typeName: 'ライト',
    categoryName: '電気装置',
    recommendedMileageInterval: null,
    recommendedPeriodMonths: null,
    description: 'ヘッドライトやテールライトの電球・LED',
  },
  {
    type: 'TURN_SIGNAL',
    category: 'ELECTRIC',
    typeName: 'ウインカー',
    categoryName: '電気装置',
    recommendedMileageInterval: null,
    recommendedPeriodMonths: null,
    description: '方向指示器の電球・LED',
  },
  {
    type: 'HORN',
    category: 'ELECTRIC',
    typeName: 'ホーン',
    categoryName: '電気装置',
    recommendedMileageInterval: null,
    recommendedPeriodMonths: null,
    description: '警音器',
  },
] as const

/**
 * メンテナンスタイプから項目情報を取得
 */
export function getMaintenanceItemByType(
  type: MaintenanceItem['type']
): MaintenanceItemWithoutId | undefined {
  return MAINTENANCE_ITEMS_MASTER.find((item) => item.type === type)
}

/**
 * カテゴリでフィルタリング
 */
export function getMaintenanceItemsByCategory(
  category: MaintenanceItem['category']
): MaintenanceItemWithoutId[] {
  return MAINTENANCE_ITEMS_MASTER.filter((item) => item.category === category)
}
