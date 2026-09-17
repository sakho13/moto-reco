import { describe, expect, it } from 'vitest'
import type { ApiResponseBikeHistoryItem } from '@repo/shared-types'
import { buildMonthlySummary } from '@/components/home/monthlySummary'

function fuelLog(
  occurredAt: string,
  mileage: number,
  amount: number,
  totalPrice: number
): ApiResponseBikeHistoryItem {
  return {
    type: 'FUEL_LOG',
    occurredAt,
    fuelLog: {
      fuelLogId: `fuel-${occurredAt}`,
      refueledAt: occurredAt,
      mileage,
      previousMileage: mileage - 100,
      amount,
      totalPrice,
      memo: null,
      isFullTank: true,
      fuelEfficiency: 20,
      pricePerLiter: totalPrice / amount,
      touringId: null,
      touringTitle: null,
    },
  }
}

describe('buildMonthlySummary', () => {
  const now = new Date('2026-09-13T12:00:00')

  it('当月の給油回数・給油量・燃料費を実測値で合算する', () => {
    const history: ApiResponseBikeHistoryItem[] = [
      fuelLog('2026-09-13T09:00:00', 13010, 11.8, 2065),
      fuelLog('2026-09-01T09:00:00', 12750, 12.4, 2170),
      fuelLog('2026-08-10T09:00:00', 12500, 11.2, 1994),
    ]

    const summary = buildMonthlySummary(history, now)

    expect(summary.fuelLogCount).toBe(2)
    expect(summary.totalFuelAmount).toBeCloseTo(11.8 + 12.4)
    expect(summary.totalFuelCost).toBe(2065 + 2170)
  })

  it('当月の給油記録が無い場合は0件・0L・0円になる', () => {
    const history: ApiResponseBikeHistoryItem[] = [
      fuelLog('2026-08-10T09:00:00', 12500, 11.2, 1994),
    ]

    const summary = buildMonthlySummary(history, now)

    expect(summary.fuelLogCount).toBe(0)
    expect(summary.totalFuelAmount).toBe(0)
    expect(summary.totalFuelCost).toBe(0)
  })

  it('ツーリング履歴は当月サマリの給油回数・給油量・燃料費に影響しない', () => {
    const history: ApiResponseBikeHistoryItem[] = [
      fuelLog('2026-09-13T09:00:00', 13010, 11.8, 2065),
      {
        type: 'TOURING',
        occurredAt: '2026-09-05T09:00:00',
        touring: {
          touringId: 'touring-1',
          touringPlanId: null,
          title: 'テストツーリング',
          startDate: '2026-09-05T08:00:00',
          endDate: '2026-09-05T17:00:00',
          startMileage: 12800,
          endMileage: 12928,
          startLatitude: null,
          startLongitude: null,
          endLatitude: null,
          endLongitude: null,
          status: 'COMPLETED',
          fuelLogIds: [],
        },
      },
    ]

    const summary = buildMonthlySummary(history, now)

    expect(summary.fuelLogCount).toBe(1)
    expect(summary.totalFuelAmount).toBeCloseTo(11.8)
    expect(summary.totalFuelCost).toBe(2065)
  })
})
