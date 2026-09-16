import { describe, expect, it } from 'vitest'
import type { ApiResponseBikeHistoryItem } from '@repo/shared-types'
import { buildMonthlySummary } from '@/components/home/monthlySummary'

function fuelLog(
  occurredAt: string,
  mileage: number,
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
      amount: 10,
      totalPrice,
      memo: null,
      isFullTank: true,
      fuelEfficiency: 20,
      pricePerLiter: totalPrice / 10,
      touringId: null,
      touringTitle: null,
    },
  }
}

describe('buildMonthlySummary', () => {
  const now = new Date('2026-09-13T12:00:00')

  it('当月の給油回数と燃料費を合算する', () => {
    const history: ApiResponseBikeHistoryItem[] = [
      fuelLog('2026-09-13T09:00:00', 13010, 2065),
      fuelLog('2026-09-01T09:00:00', 12750, 2170),
      fuelLog('2026-08-10T09:00:00', 12500, 1994),
    ]

    const summary = buildMonthlySummary(history, 13010, now)

    expect(summary.fuelLogCount).toBe(2)
    expect(summary.totalFuelCost).toBe(2065 + 2170)
  })

  it('当月より前の給油記録があれば、現在の総走行距離との差分で当月の走行距離を求める', () => {
    const history: ApiResponseBikeHistoryItem[] = [
      fuelLog('2026-09-13T09:00:00', 13010, 2065),
      fuelLog('2026-08-10T09:00:00', 12500, 1994),
    ]

    const summary = buildMonthlySummary(history, 13010, now)

    expect(summary.distanceKm).toBe(13010 - 12500)
  })

  it('当月より前の給油記録が無い場合は走行距離を算出できない（null）', () => {
    const history: ApiResponseBikeHistoryItem[] = [
      fuelLog('2026-09-13T09:00:00', 13010, 2065),
    ]

    const summary = buildMonthlySummary(history, 13010, now)

    expect(summary.distanceKm).toBeNull()
  })

  it('現在の総走行距離が不明な場合は走行距離を算出できない（null）', () => {
    const history: ApiResponseBikeHistoryItem[] = [
      fuelLog('2026-08-10T09:00:00', 12500, 1994),
    ]

    const summary = buildMonthlySummary(history, null, now)

    expect(summary.distanceKm).toBeNull()
  })

  it('当月の給油記録が無い場合は0件・0円になる（—ではない）', () => {
    const history: ApiResponseBikeHistoryItem[] = [
      fuelLog('2026-08-10T09:00:00', 12500, 1994),
    ]

    const summary = buildMonthlySummary(history, 13010, now)

    expect(summary.fuelLogCount).toBe(0)
    expect(summary.totalFuelCost).toBe(0)
  })

  it('ツーリング履歴は当月サマリの給油回数・燃料費に影響しない', () => {
    const history: ApiResponseBikeHistoryItem[] = [
      fuelLog('2026-09-13T09:00:00', 13010, 2065),
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

    const summary = buildMonthlySummary(history, 13010, now)

    expect(summary.fuelLogCount).toBe(1)
    expect(summary.totalFuelCost).toBe(2065)
  })
})
