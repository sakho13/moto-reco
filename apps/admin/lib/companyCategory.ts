export const COMPANY_CATEGORY_OPTIONS = [
  { value: 'BIKE_MAKER', label: 'バイクメーカー' },
  { value: 'GOODS_MANUFACTURER', label: 'グッズ製造会社' },
] as const

export function getCompanyCategoryLabel(value: string): string {
  return (
    COMPANY_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ??
    value
  )
}
