/** 小数点以下の桁数を指定して、桁区切り付きで表示する */
function formatNumber(value: number, fractionDigits: number): string {
  return value.toLocaleString('ja-JP', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

/** 走行距離（例: 12,345 km） */
export function formatKm(value: number): string {
  return `${formatNumber(value, 0)} km`
}

/** 給油量（例: 8.52 L） */
export function formatLiter(value: number): string {
  return `${formatNumber(value, 2)} L`
}

/** 金額（例: ¥1,500） */
export function formatYen(value: number): string {
  return `¥${formatNumber(value, 0)}`
}

/** 燃費（例: 32.1 km/L） */
export function formatEfficiency(value: number): string {
  return `${formatNumber(value, 1)} km/L`
}

/** 単価（例: 176 円/L） */
export function formatPricePerLiter(value: number): string {
  return `${formatNumber(value, 0)} 円/L`
}
