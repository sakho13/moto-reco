import { TouringPlanId } from '@repo/shared-types'
import { TouringPlanSpotEntity } from '../entities/TouringPlanSpotEntity'
import { ITouringPlanSpotRepository } from '../interfaces/ITouringPlanSpotRepository'
import { calculateTouringPlanSpotTimes } from './calculateTouringPlanSpotTimes'

export type TouringPlanSpotWithTimes = {
  spot: TouringPlanSpotEntity
  plannedArrivalOffsetMinutes: number | null
  plannedDepartureOffsetMinutes: number | null
}

/**
 * プランの全スポットを `START → SPOT/BREAK(sortOrder昇順) → DESTINATION` の順に並び替え、
 * {@link calculateTouringPlanSpotTimes} で予定到着・予定出発までの経過分数を計算して返す。
 *
 * @remarks 計算結果は永続化しない（オンザフライ計算）。
 */
export async function computeTouringPlanSpotTimes(
  touringPlanSpotRepository: ITouringPlanSpotRepository,
  planId: TouringPlanId
): Promise<TouringPlanSpotWithTimes[]> {
  const spots = await touringPlanSpotRepository.findPlanSpotsByPlanId(planId)

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
