import { describe, expect, test } from 'vitest'
import { TouringPlanSpotType } from '@repo/shared-types'
import { calculateTouringPlanSpotTimes } from '@/lib/api/server/services/calculateTouringPlanSpotTimes'

type SpotTimeInput = {
  type: TouringPlanSpotType
  stayMinutes: number | null
  travelMinutesFromPrev: number | null
}

describe('calculateTouringPlanSpotTimes', () => {
  test('チェイン全体が計算できる場合、各スポットの予定到着・出発までの経過分数が正しく算出される', () => {
    const orderedSpots: SpotTimeInput[] = [
      // START
      { type: 'START', stayMinutes: null, travelMinutesFromPrev: null },
      // SPOT: 出発地から60分、滞在30分
      { type: 'SPOT', stayMinutes: 30, travelMinutesFromPrev: 60 },
      // DESTINATION: SPOTから90分
      { type: 'DESTINATION', stayMinutes: null, travelMinutesFromPrev: 90 },
    ]

    const result = calculateTouringPlanSpotTimes(orderedSpots)

    expect(result).toHaveLength(3)

    // START: 到着なし、出発は0分後
    expect(result[0]).toEqual({
      plannedArrivalOffsetMinutes: null,
      plannedDepartureOffsetMinutes: 0,
    })

    // SPOT: 到着 0 + 60分 = 60分後, 出発 60 + 30分 = 90分後
    expect(result[1]).toEqual({
      plannedArrivalOffsetMinutes: 60,
      plannedDepartureOffsetMinutes: 90,
    })

    // DESTINATION: 到着 90 + 90分 = 180分後, 出発は常にnull
    expect(result[2]).toEqual({
      plannedArrivalOffsetMinutes: 180,
      plannedDepartureOffsetMinutes: null,
    })
  })

  test('途中のスポットのtravelMinutesFromPrevが未設定の場合、以降のスポットはすべてnullになる', () => {
    const orderedSpots: SpotTimeInput[] = [
      { type: 'START', stayMinutes: null, travelMinutesFromPrev: null },
      // SPOT1: 出発地から60分
      { type: 'SPOT', stayMinutes: 30, travelMinutesFromPrev: 60 },
      // SPOT2: SPOT1からの移動時間が未入力
      { type: 'SPOT', stayMinutes: 15, travelMinutesFromPrev: null },
      // DESTINATION: SPOT2からの移動時間は設定されているが、currentOffsetがnullなので計算不可
      { type: 'DESTINATION', stayMinutes: null, travelMinutesFromPrev: 45 },
    ]

    const result = calculateTouringPlanSpotTimes(orderedSpots)

    expect(result).toHaveLength(4)

    // START, SPOT1までは正常に計算される
    expect(result[0]).toEqual({
      plannedArrivalOffsetMinutes: null,
      plannedDepartureOffsetMinutes: 0,
    })
    expect(result[1]).toEqual({
      plannedArrivalOffsetMinutes: 60,
      plannedDepartureOffsetMinutes: 90,
    })

    // SPOT2: SPOT2自身のtravelMinutesFromPrevがnullのため、
    // SPOT1の時点でcurrentOffsetがnullとなり、SPOT2以降は両方null
    expect(result[2]).toEqual({
      plannedArrivalOffsetMinutes: null,
      plannedDepartureOffsetMinutes: null,
    })

    // DESTINATION: currentOffsetがnullになっているため両方null
    expect(result[3]).toEqual({
      plannedArrivalOffsetMinutes: null,
      plannedDepartureOffsetMinutes: null,
    })
  })

  test('stayMinutesが未設定のSPOT/BREAKは滞在時間0分として扱われる', () => {
    const orderedSpots: SpotTimeInput[] = [
      { type: 'START', stayMinutes: null, travelMinutesFromPrev: null },
      // SPOT: stayMinutes未設定
      { type: 'SPOT', stayMinutes: null, travelMinutesFromPrev: 30 },
      { type: 'DESTINATION', stayMinutes: null, travelMinutesFromPrev: 30 },
    ]

    const result = calculateTouringPlanSpotTimes(orderedSpots)

    const spot = result[1]
    expect(spot?.plannedArrivalOffsetMinutes).not.toBeNull()
    expect(spot?.plannedDepartureOffsetMinutes).not.toBeNull()
    // 滞在時間0分のため到着までの経過分数と出発までの経過分数が一致する
    expect(spot?.plannedDepartureOffsetMinutes).toBe(
      spot?.plannedArrivalOffsetMinutes
    )
  })

  describe('経由地なし（START/DESTINATIONのみ）の場合', () => {
    test('DESTINATION.travelMinutesFromPrevが設定されている場合、正しく計算される', () => {
      const orderedSpots: SpotTimeInput[] = [
        { type: 'START', stayMinutes: null, travelMinutesFromPrev: null },
        { type: 'DESTINATION', stayMinutes: null, travelMinutesFromPrev: 120 },
      ]

      const result = calculateTouringPlanSpotTimes(orderedSpots)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        plannedArrivalOffsetMinutes: null,
        plannedDepartureOffsetMinutes: 0,
      })
      expect(result[1]).toEqual({
        plannedArrivalOffsetMinutes: 120,
        plannedDepartureOffsetMinutes: null,
      })
    })

    test('DESTINATION.travelMinutesFromPrevがnullの場合、DESTINATIONの両方がnullになる', () => {
      const orderedSpots: SpotTimeInput[] = [
        { type: 'START', stayMinutes: null, travelMinutesFromPrev: null },
        { type: 'DESTINATION', stayMinutes: null, travelMinutesFromPrev: null },
      ]

      const result = calculateTouringPlanSpotTimes(orderedSpots)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        plannedArrivalOffsetMinutes: null,
        plannedDepartureOffsetMinutes: 0,
      })
      expect(result[1]).toEqual({
        plannedArrivalOffsetMinutes: null,
        plannedDepartureOffsetMinutes: null,
      })
    })
  })

  test('複数のSPOT/BREAKが連続する場合、チェインが正しく繋がる', () => {
    const orderedSpots: SpotTimeInput[] = [
      { type: 'START', stayMinutes: null, travelMinutesFromPrev: null },
      // SPOT1: 出発地から30分、滞在10分
      { type: 'SPOT', stayMinutes: 10, travelMinutesFromPrev: 30 },
      // BREAK: SPOT1から20分、滞在15分
      { type: 'BREAK', stayMinutes: 15, travelMinutesFromPrev: 20 },
      // SPOT2: BREAKから40分、滞在5分
      { type: 'SPOT', stayMinutes: 5, travelMinutesFromPrev: 40 },
      // DESTINATION: SPOT2から25分
      { type: 'DESTINATION', stayMinutes: null, travelMinutesFromPrev: 25 },
    ]

    const result = calculateTouringPlanSpotTimes(orderedSpots)

    expect(result).toHaveLength(5)

    // START
    expect(result[0]).toEqual({
      plannedArrivalOffsetMinutes: null,
      plannedDepartureOffsetMinutes: 0,
    })

    // SPOT1: 0 + 30分 = 30分後着, 30 + 10分 = 40分後発
    expect(result[1]).toEqual({
      plannedArrivalOffsetMinutes: 30,
      plannedDepartureOffsetMinutes: 40,
    })

    // BREAK: 40 + 20分 = 60分後着, 60 + 15分 = 75分後発
    expect(result[2]).toEqual({
      plannedArrivalOffsetMinutes: 60,
      plannedDepartureOffsetMinutes: 75,
    })

    // SPOT2: 75 + 40分 = 115分後着, 115 + 5分 = 120分後発
    expect(result[3]).toEqual({
      plannedArrivalOffsetMinutes: 115,
      plannedDepartureOffsetMinutes: 120,
    })

    // DESTINATION: 120 + 25分 = 145分後着, 発はnull
    expect(result[4]).toEqual({
      plannedArrivalOffsetMinutes: 145,
      plannedDepartureOffsetMinutes: null,
    })
  })
})
