import { describe, expect, it } from 'vitest'
import type { ApiResponseMaintenanceScheduleItem } from '@repo/shared-types'
import { computeMaintenanceProgressRatio } from '@/components/home/maintenanceProgress'

function mileageItem(
  lastRecordMileage: number,
  remainingMileage: number
): ApiResponseMaintenanceScheduleItem {
  return {
    type: 'ENGINE_OIL',
    category: 'ENGINE',
    typeName: 'エンジンオイル',
    categoryName: 'エンジン',
    basis: 'MILEAGE',
    remainingMileage,
    dueDate: null,
    remainingDays: null,
    lastRecord: {
      performedAt: '2026-06-30T00:00:00',
      mileage: lastRecordMileage,
    },
    status: remainingMileage < 0 ? 'OVERDUE' : 'OK',
  }
}

function periodItem(
  lastRecordAt: string,
  dueDate: string
): ApiResponseMaintenanceScheduleItem {
  return {
    type: 'BATTERY',
    category: 'ELECTRIC',
    typeName: 'バッテリー',
    categoryName: '電気装置',
    basis: 'PERIOD',
    remainingMileage: null,
    dueDate,
    remainingDays: 0,
    lastRecord: { performedAt: lastRecordAt, mileage: 10000 },
    status: 'OK',
  }
}

describe('computeMaintenanceProgressRatio', () => {
  it('MILEAGE基準: 前回記録からの経過距離 ÷ 推奨間隔（=経過+残り）を返す', () => {
    // 前回12,260km時点で交換、推奨間隔3,000km（残り1,240km） → 現在13,010km
    // 経過 = 13010 - 12260 = 750, interval = 750 + 1240 = 1990
    const item = mileageItem(12260, 1240)

    const ratio = computeMaintenanceProgressRatio(
      item,
      13010,
      new Date('2026-09-13T00:00:00')
    )

    expect(ratio).toBeCloseTo(750 / 1990, 5)
  })

  it('MILEAGE基準: 超過（残りが負）でも 0〜1 にクランプする', () => {
    const item = mileageItem(10000, -500)

    const ratio = computeMaintenanceProgressRatio(
      item,
      13010,
      new Date('2026-09-13T00:00:00')
    )

    expect(ratio).toBe(1)
  })

  it('PERIOD基準: 前回記録日〜期限日の経過割合を返す', () => {
    const item = periodItem('2026-01-01T00:00:00', '2027-01-01T00:00:00')

    // 半年経過 ≒ 0.5
    const ratio = computeMaintenanceProgressRatio(
      item,
      null,
      new Date('2026-07-02T00:00:00')
    )

    expect(ratio).toBeGreaterThan(0.49)
    expect(ratio).toBeLessThan(0.51)
  })

  it('記録が無い項目は null を返す', () => {
    const item: ApiResponseMaintenanceScheduleItem = {
      type: 'ENGINE_OIL',
      category: 'ENGINE',
      typeName: 'エンジンオイル',
      categoryName: 'エンジン',
      basis: null,
      remainingMileage: null,
      dueDate: null,
      remainingDays: null,
      lastRecord: null,
      status: 'NO_RECORD',
    }

    expect(computeMaintenanceProgressRatio(item, 13010, new Date())).toBeNull()
  })

  it('MILEAGE基準だが現在の総走行距離が不明な場合は null を返す', () => {
    const item = mileageItem(12260, 1240)

    expect(
      computeMaintenanceProgressRatio(item, null, new Date('2026-09-13'))
    ).toBeNull()
  })
})
