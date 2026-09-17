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

  it('月初直前の給油が月境界のごく直前の場合は、按分比率が1に近く実測差分とほぼ一致する', () => {
    const history: ApiResponseBikeHistoryItem[] = [
      fuelLog('2026-08-31T23:59:59', 12750, 2170),
    ]

    const summary = buildMonthlySummary(history, 13010, now)

    // baseline(月初のごく直前)〜nowのほぼ全期間が「今月」なので、按分後も実測差分とほぼ一致する
    expect(summary.distanceKm).toBe(13010 - 12750)
  })

  it('月初直前の給油が月境界と一致しない場合、前月分の走行距離が今月分に混入しないよう按分する', () => {
    // 回帰再現: 8/20に12,500kmで給油し、9/13時点で現在ODOが13,010kmの場合、
    // 8/20〜31（前月分）の走行まで「今月の走行距離」に加算されてはいけない
    // （修正前は 13010-12500=510 をそのまま返していた）。
    const baselineAt = new Date('2026-08-20T00:00:00')
    const nowAt = new Date('2026-09-13T00:00:00')
    const monthStartAt = new Date('2026-09-01T00:00:00')

    const history: ApiResponseBikeHistoryItem[] = [
      fuelLog('2026-08-20T00:00:00', 12500, 1994),
    ]

    const summary = buildMonthlySummary(history, 13010, nowAt)

    const totalMs = nowAt.getTime() - baselineAt.getTime()
    const inMonthMs = nowAt.getTime() - monthStartAt.getTime()
    const expected = Math.round((13010 - 12500) * (inMonthMs / totalMs))

    // 前月分（8/20〜31）が混入しないため、修正前の510より小さい値になる
    expect(summary.distanceKm).toBe(expected)
    expect(summary.distanceKm).toBeLessThan(510)
  })

  it('月初直前の給油が月初に近いほど、按分後の値は実測差分に近づく', () => {
    const history: ApiResponseBikeHistoryItem[] = [
      fuelLog('2026-08-31T12:00:00', 12500, 1994),
    ]

    const summary = buildMonthlySummary(history, 13010, now) // now: 2026-09-13T12:00:00

    // baseline〜nowが13日、うち月初以降が12.5日 → 比率は1に近いが1ではない
    expect(summary.distanceKm).not.toBeNull()
    expect(summary.distanceKm as number).toBeLessThan(510)
    expect(summary.distanceKm as number).toBeGreaterThan(480)
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
