import { describe, expect, it } from 'vitest'
import { buildEfficiencyLabels } from './efficiencyLabel'

describe('buildEfficiencyLabels', () => {
  it('燃費・継ぎ足し・初回給油・前回が継ぎ足しを出し分ける', () => {
    // 給油日時の新しい順（一覧の並び）
    const labels = buildEfficiencyLabels([
      { fuelLogId: 'd', mileage: 1300, isFullTank: true, fuelEfficiency: 30 },
      { fuelLogId: 'c', mileage: 1200, isFullTank: true, fuelEfficiency: null },
      {
        fuelLogId: 'b',
        mileage: 1100,
        isFullTank: false,
        fuelEfficiency: null,
      },
      { fuelLogId: 'a', mileage: 1000, isFullTank: true, fuelEfficiency: null },
    ])

    expect(labels.get('d')).toBe('30.0 km/L')
    expect(labels.get('c')).toBe('前回が継ぎ足し')
    expect(labels.get('b')).toBe('継ぎ足し')
    expect(labels.get('a')).toBe('初回給油')
  })
})
