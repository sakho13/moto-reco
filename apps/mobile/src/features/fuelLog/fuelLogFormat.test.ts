import { describe, expect, it } from 'vitest'
import {
  formatEfficiency,
  formatKm,
  formatLiter,
  formatPricePerLiter,
  formatYen,
} from './fuelLogFormat'

describe('給油記録の表示', () => {
  it('桁区切りと単位を付ける', () => {
    expect(formatKm(12345)).toBe('12,345 km')
    expect(formatYen(1500)).toBe('¥1,500')
  })

  it('給油量は小数2桁、燃費は小数1桁、単価は整数で表示する', () => {
    expect(formatLiter(8.5)).toBe('8.50 L')
    expect(formatEfficiency(32.149)).toBe('32.1 km/L')
    expect(formatPricePerLiter(176.47)).toBe('176 円/L')
  })
})
