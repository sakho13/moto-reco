import { TouringPlanId } from '@repo/shared-types'
import { TouringPlanSpotEntity } from '../entities/TouringPlanSpotEntity'
import { ITouringPlanSpotRepository } from '../interfaces/ITouringPlanSpotRepository'
import { calculateTouringPlanSpotTimes } from './calculateTouringPlanSpotTimes'

/**
 * ツーリングプランの各スポットの予定到着・予定出発までの経過分数を再計算し、
 * 変更があれば永続化する。
 *
 * @remarks
 * 1. プランの全スポットを取得し、`START → SPOT/BREAK(sortOrder昇順) → DESTINATION`
 *    の順に並び替える。
 * 2. {@link calculateTouringPlanSpotTimes} で各スポットの予定到着・予定出発までの
 *    経過分数を計算する。
 * 3. 計算結果が既存値と異なるスポットのみ更新する。
 *
 * @param touringPlanSpotRepository - ツーリングプランスポットリポジトリ
 * @param planId - 対象のツーリングプランID
 */
export async function recomputeTouringPlanSpotTimes(
  touringPlanSpotRepository: ITouringPlanSpotRepository,
  planId: TouringPlanId
): Promise<void> {
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

  for (let i = 0; i < orderedSpots.length; i++) {
    const spot = orderedSpots[i]
    const computed = computedTimes[i]
    if (!spot || !computed) continue

    if (
      spot.plannedArrivalOffsetMinutes ===
        computed.plannedArrivalOffsetMinutes &&
      spot.plannedDepartureOffsetMinutes ===
        computed.plannedDepartureOffsetMinutes
    ) {
      continue
    }

    await touringPlanSpotRepository.updatePlanSpot(
      new TouringPlanSpotEntity({
        ...spot.toJson(),
        plannedArrivalOffsetMinutes: computed.plannedArrivalOffsetMinutes,
        plannedDepartureOffsetMinutes: computed.plannedDepartureOffsetMinutes,
      })
    )
  }
}
