export const GOODS_CATEGORY_OPTIONS = [
  { value: 'HELMET', label: 'ヘルメット' },
  { value: 'GLOVE', label: 'グローブ' },
  { value: 'JACKET', label: 'ジャケット' },
  { value: 'PANTS', label: 'パンツ' },
  { value: 'BOOTS', label: 'ブーツ' },
  { value: 'RAINWEAR', label: 'レインウェア' },
  { value: 'INTERCOM', label: 'インカム' },
  { value: 'DRIVE_RECORDER', label: 'ドライブレコーダー' },
  { value: 'NAVIGATION', label: 'ナビ' },
  { value: 'ELECTRICAL', label: '電装系' },
  { value: 'BOX_CASE', label: 'ボックス・パニアケース' },
  { value: 'BAG', label: 'バッグ' },
  { value: 'CHAIN_LOCK', label: 'チェーンロック' },
  { value: 'COVER', label: 'バイクカバー' },
  { value: 'TOOL', label: '工具' },
  { value: 'OTHER', label: 'その他' },
] as const

export function getGoodsCategoryLabel(value: string): string {
  return (
    GOODS_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ??
    value
  )
}
