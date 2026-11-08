import {
  TouringPlanSpotEntity,
  ITouringPlanSpotRepository,
} from '@repo/shared-domain'
import { TouringPlanId } from '@repo/shared-types'
import { calculateTouringPlanSpotTimes } from './calculateTouringPlanSpotTimes'

export type TouringPlanSpotWithTimes = {
  spot: TouringPlanSpotEntity
  plannedArrivalOffsetMinutes: number | null
  plannedDepartureOffsetMinutes: number | null
}

/**
 * スポットを `START → SPOT/BREAK(sortOrder昇順) → DESTINATION` の順に並び替え、
 * {@link calculateTouringPlanSpotTimes} で予定到着・予定出発までの経過分数を計算して返す。
 */
export function withTouringPlanSpotTimes(
  spots: TouringPlanSpotEntity[]
): TouringPlanSpotWithTimes[] {
  const startSpot = spots.find((s) => s.type === 'START')
  const destinationSpot = spots.find((s) => s.type === 'DESTINATION')
  const waypoints = spots
    .filter((s) => s.type === 'SPOT' || s.type === 'BREAK')
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const orderedSpots = [
    ...(startSpot ? [startSpot] : []),
    ...waypoints,
    ...(destinationSpot ? [destinationSpot] : []),
  ]

  const computedTimes = calculateTouringPlanSpotTimes(
    orderedSpots.map((spot) => ({
      type: spot.type,
      stayMinutes: spot.stayMinutes,
      travelMinutesFromPrev: spot.travelMinutesFromPrev,
    }))
  )

  return orderedSpots.map((spot, i) => ({
    spot,
    plannedArrivalOffsetMinutes:
      computedTimes[i]?.plannedArrivalOffsetMinutes ?? null,
    plannedDepartureOffsetMinutes:
      computedTimes[i]?.plannedDepartureOffsetMinutes ?? null,
  }))
}

/**
 * プランの全スポットを取得し、予定到着・予定出発までの経過分数を計算して返す。
 *
 * @remarks 計算結果は永続化しない（オンザフライ計算）。
 */
export async function computeTouringPlanSpotTimes(
  touringPlanSpotRepository: ITouringPlanSpotRepository,
  planId: TouringPlanId
): Promise<TouringPlanSpotWithTimes[]> {
  return withTouringPlanSpotTimes(
    await touringPlanSpotRepository.findPlanSpotsByPlanId(planId)
  )
}

/**
 * 出発から目的地（未設定なら最後の地点の出発）までの予定分数を返す
 *
 * @param spots - {@link withTouringPlanSpotTimes} の結果
 * @returns 出発地が未設定、出発地しかない、または移動時間が未入力の区間があるときは `null`
 */
export function getPlannedTotalMinutes(
  spots: TouringPlanSpotWithTimes[]
): number | null {
  const last = spots.at(-1)
  if (spots[0]?.spot.type !== 'START' || !last || last === spots[0]) return null
  return last.spot.type === 'DESTINATION'
    ? last.plannedArrivalOffsetMinutes
    : last.plannedDepartureOffsetMinutes
}
