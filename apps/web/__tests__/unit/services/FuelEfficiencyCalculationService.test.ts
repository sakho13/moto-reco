import { describe, expect, test } from 'vitest'
import { FuelEfficiencyCalculationService } from '@repo/shared-domain'

describe('FuelEfficiencyCalculationService', () => {
  const service = new FuelEfficiencyCalculationService()

  test('初回給油（直前の満タン給油が存在しない）はnullになる', () => {
    const result = service.calculate([
      { fuelLogId: 'log-1', mileage: 1000, amount: 10, isFullTank: true },
    ])

    expect(result.get('log-1')).toBeNull()
  })

  test('継ぎ足し給油は常にnullになる', () => {
    const result = service.calculate([
      { fuelLogId: 'log-1', mileage: 1000, amount: 10, isFullTank: true },
      { fuelLogId: 'log-2', mileage: 1100, amount: 3, isFullTank: false },
    ])

    expect(result.get('log-2')).toBeNull()
  })

  test('満タン給油のみの場合、従来の (mileage-previousMileage)/amount と一致する', () => {
    const result = service.calculate([
      { fuelLogId: 'log-1', mileage: 1000, amount: 10, isFullTank: true },
      { fuelLogId: 'log-2', mileage: 1500, amount: 12, isFullTank: true },
      { fuelLogId: 'log-3', mileage: 2000, amount: 11.5, isFullTank: true },
    ])

    // (1500-1000)/12 = 41.666... -> 41.7
    expect(result.get('log-2')).toBeCloseTo(41.7, 5)
    // (2000-1500)/11.5 = 43.478... -> 43.5
    expect(result.get('log-3')).toBeCloseTo(43.5, 5)
  })

  test('満タン→継ぎ足し→満タンの場合、継ぎ足し分の給油量が次の満タンに繰り込まれる', () => {
    const result = service.calculate([
      { fuelLogId: 'full-1', mileage: 1000, amount: 10, isFullTank: true },
      { fuelLogId: 'partial-1', mileage: 1100, amount: 3, isFullTank: false },
      { fuelLogId: 'full-2', mileage: 1250, amount: 8, isFullTank: true },
    ])

    expect(result.get('full-1')).toBeNull()
    expect(result.get('partial-1')).toBeNull()
    // 区間距離: 1250-1000=250, 給油量: 3(継ぎ足し)+8(満タン)=11 => 250/11=22.727... -> 22.7
    expect(result.get('full-2')).toBeCloseTo(22.7, 5)
  })

  test('満タン→継ぎ足し→継ぎ足し→満タンの場合、複数の継ぎ足し分がまとめて繰り込まれる', () => {
    const result = service.calculate([
      { fuelLogId: 'full-1', mileage: 1000, amount: 10, isFullTank: true },
      { fuelLogId: 'partial-1', mileage: 1100, amount: 3, isFullTank: false },
      { fuelLogId: 'partial-2', mileage: 1180, amount: 2, isFullTank: false },
      { fuelLogId: 'full-2', mileage: 1300, amount: 7, isFullTank: true },
    ])

    // 区間距離: 1300-1000=300, 給油量: 3+2+7=12 => 300/12=25
    expect(result.get('full-2')).toBeCloseTo(25, 5)
  })

  test('区間距離が0以下の場合はnullになる', () => {
    const result = service.calculate([
      { fuelLogId: 'log-1', mileage: 1000, amount: 10, isFullTank: true },
      { fuelLogId: 'log-2', mileage: 1000, amount: 5, isFullTank: true },
    ])

    expect(result.get('log-2')).toBeNull()
  })

  test('入力が空配列の場合は空のMapを返す', () => {
    const result = service.calculate([])
    expect(result.size).toBe(0)
  })
})
