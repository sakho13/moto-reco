import { describe, expect, test } from 'vitest'
import { TouringPlanSpotType } from '@repo/shared-types'
import { calculateTouringPlanSpotTimes } from '@/lib/api/server/services/calculateTouringPlanSpotTimes'

type SpotTimeInput = {
  type: TouringPlanSpotType
  stayMinutes: number | null
  travelMinutesFromPrev: number | null
}

const DEPART_AT = new Date('2026-07-01T08:00:00.000Z')

const minutesAfter = (base: Date, minutes: number): Date =>
  new Date(base.getTime() + minutes * 60 * 1000)

describe('calculateTouringPlanSpotTimes', () => {
  test('チェイン全体が計算できる場合、各スポットの予定到着・出発時刻が正しく算出される', () => {
    const orderedSpots: SpotTimeInput[] = [
      // START
      { type: 'START', stayMinutes: null, travelMinutesFromPrev: null },
      // SPOT: 出発地から60分、滞在30分
      { type: 'SPOT', stayMinutes: 30, travelMinutesFromPrev: 60 },
      // DESTINATION: SPOTから90分
      { type: 'DESTINATION', stayMinutes: null, travelMinutesFromPrev: 90 },
    ]

    const result = calculateTouringPlanSpotTimes(DEPART_AT, orderedSpots)

    expect(result).toHaveLength(3)

    // START: 到着なし、出発はdepartAt
    expect(result[0]).toEqual({
      plannedArrivalAt: null,
      plannedDepartureAt: DEPART_AT,
    })

    // SPOT: 到着 08:00 + 60分 = 09:00, 出発 09:00 + 30分 = 09:30
    const spotArrival = minutesAfter(DEPART_AT, 60)
    const spotDeparture = minutesAfter(spotArrival, 30)
    expect(result[1]).toEqual({
      plannedArrivalAt: spotArrival,
      plannedDepartureAt: spotDeparture,
    })

    // DESTINATION: 到着 09:30 + 90分 = 11:00, 出発は常にnull
    const destinationArrival = minutesAfter(spotDeparture, 90)
    expect(result[2]).toEqual({
      plannedArrivalAt: destinationArrival,
      plannedDepartureAt: null,
    })
  })

  test('途中のスポットのtravelMinutesFromPrevが未設定の場合、以降のスポットはすべてnullになる', () => {
    const orderedSpots: SpotTimeInput[] = [
      { type: 'START', stayMinutes: null, travelMinutesFromPrev: null },
      // SPOT1: 出発地から60分
      { type: 'SPOT', stayMinutes: 30, travelMinutesFromPrev: 60 },
      // SPOT2: SPOT1からの移動時間が未入力
      { type: 'SPOT', stayMinutes: 15, travelMinutesFromPrev: null },
      // DESTINATION: SPOT2からの移動時間は設定されているが、currentTimeがnullなので計算不可
      { type: 'DESTINATION', stayMinutes: null, travelMinutesFromPrev: 45 },
    ]

    const result = calculateTouringPlanSpotTimes(DEPART_AT, orderedSpots)

    expect(result).toHaveLength(4)

    // START, SPOT1までは正常に計算される
    expect(result[0]).toEqual({
      plannedArrivalAt: null,
      plannedDepartureAt: DEPART_AT,
    })
    const spot1Arrival = minutesAfter(DEPART_AT, 60)
    const spot1Departure = minutesAfter(spot1Arrival, 30)
    expect(result[1]).toEqual({
      plannedArrivalAt: spot1Arrival,
      plannedDepartureAt: spot1Departure,
    })

    // SPOT2: SPOT2自身のtravelMinutesFromPrevがnullのため、
    // SPOT1の時点でcurrentTimeがnullとなり、SPOT2以降は両方null
    expect(result[2]).toEqual({
      plannedArrivalAt: null,
      plannedDepartureAt: null,
    })

    // DESTINATION: currentTimeがnullになっているため両方null
    expect(result[3]).toEqual({
      plannedArrivalAt: null,
      plannedDepartureAt: null,
    })
  })

  test('stayMinutesが未設定のSPOT/BREAKは滞在時間0分として扱われる', () => {
    const orderedSpots: SpotTimeInput[] = [
      { type: 'START', stayMinutes: null, travelMinutesFromPrev: null },
      // SPOT: stayMinutes未設定
      { type: 'SPOT', stayMinutes: null, travelMinutesFromPrev: 30 },
      { type: 'DESTINATION', stayMinutes: null, travelMinutesFromPrev: 30 },
    ]

    const result = calculateTouringPlanSpotTimes(DEPART_AT, orderedSpots)

    const spot = result[1]
    expect(spot?.plannedArrivalAt).not.toBeNull()
    expect(spot?.plannedDepartureAt).not.toBeNull()
    // 滞在時間0分のため到着時刻と出発時刻が一致する
    expect(spot?.plannedDepartureAt?.getTime()).toBe(
      spot?.plannedArrivalAt?.getTime()
    )
  })

  describe('経由地なし（START/DESTINATIONのみ）の場合', () => {
    test('DESTINATION.travelMinutesFromPrevが設定されている場合、正しく計算される', () => {
      const orderedSpots: SpotTimeInput[] = [
        { type: 'START', stayMinutes: null, travelMinutesFromPrev: null },
        { type: 'DESTINATION', stayMinutes: null, travelMinutesFromPrev: 120 },
      ]

      const result = calculateTouringPlanSpotTimes(DEPART_AT, orderedSpots)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        plannedArrivalAt: null,
        plannedDepartureAt: DEPART_AT,
      })
      expect(result[1]).toEqual({
        plannedArrivalAt: minutesAfter(DEPART_AT, 120),
        plannedDepartureAt: null,
      })
    })

    test('DESTINATION.travelMinutesFromPrevがnullの場合、DESTINATIONの両方がnullになる', () => {
      const orderedSpots: SpotTimeInput[] = [
        { type: 'START', stayMinutes: null, travelMinutesFromPrev: null },
        { type: 'DESTINATION', stayMinutes: null, travelMinutesFromPrev: null },
      ]

      const result = calculateTouringPlanSpotTimes(DEPART_AT, orderedSpots)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        plannedArrivalAt: null,
        plannedDepartureAt: DEPART_AT,
      })
      expect(result[1]).toEqual({
        plannedArrivalAt: null,
        plannedDepartureAt: null,
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

    const result = calculateTouringPlanSpotTimes(DEPART_AT, orderedSpots)

    expect(result).toHaveLength(5)

    // START
    expect(result[0]).toEqual({
      plannedArrivalAt: null,
      plannedDepartureAt: DEPART_AT,
    })

    // SPOT1: 08:00 + 30分 = 08:30 着, 08:30 + 10分 = 08:40 発
    const spot1Arrival = minutesAfter(DEPART_AT, 30)
    const spot1Departure = minutesAfter(spot1Arrival, 10)
    expect(result[1]).toEqual({
      plannedArrivalAt: spot1Arrival,
      plannedDepartureAt: spot1Departure,
    })

    // BREAK: 08:40 + 20分 = 09:00 着, 09:00 + 15分 = 09:15 発
    const breakArrival = minutesAfter(spot1Departure, 20)
    const breakDeparture = minutesAfter(breakArrival, 15)
    expect(result[2]).toEqual({
      plannedArrivalAt: breakArrival,
      plannedDepartureAt: breakDeparture,
    })

    // SPOT2: 09:15 + 40分 = 09:55 着, 09:55 + 5分 = 10:00 発
    const spot2Arrival = minutesAfter(breakDeparture, 40)
    const spot2Departure = minutesAfter(spot2Arrival, 5)
    expect(result[3]).toEqual({
      plannedArrivalAt: spot2Arrival,
      plannedDepartureAt: spot2Departure,
    })

    // DESTINATION: 10:00 + 25分 = 10:25 着, 発はnull
    expect(result[4]).toEqual({
      plannedArrivalAt: minutesAfter(spot2Departure, 25),
      plannedDepartureAt: null,
    })
  })
})
