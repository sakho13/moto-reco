import type { GoodsCategory } from '@repo/shared-types'

/**
 * グッズカテゴリの表示ラベル
 */
export const GOODS_CATEGORY_LABELS: Record<GoodsCategory, string> = {
  HELMET: 'ヘルメット',
  GLOVE: 'グローブ',
  JACKET: 'ジャケット',
  PANTS: 'パンツ',
  BOOTS: 'ブーツ',
  RAINWEAR: 'レインウェア',
  INTERCOM: 'インカム',
  DRIVE_RECORDER: 'ドライブレコーダー',
  NAVIGATION: 'ナビ',
  BOX_CASE: 'ボックス・パニアケース',
  BAG: 'バッグ',
  CHAIN_LOCK: 'チェーンロック',
  COVER: 'バイクカバー',
  TOOL: '工具',
  OTHER: 'その他',
}

/**
 * グッズカテゴリの表示順
 */
export const GOODS_CATEGORY_ORDER: GoodsCategory[] = [
  'HELMET',
  'GLOVE',
  'JACKET',
  'PANTS',
  'BOOTS',
  'RAINWEAR',
  'INTERCOM',
  'DRIVE_RECORDER',
  'NAVIGATION',
  'BOX_CASE',
  'BAG',
  'CHAIN_LOCK',
  'COVER',
  'TOOL',
  'OTHER',
]
