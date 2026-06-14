import { TouringPlanId } from '@repo/shared-types'
import { TouringPlanSpotEntity } from '../entities/TouringPlanSpotEntity'
import { ITouringPlanSpotRepository } from '../interfaces/ITouringPlanSpotRepository'
import {
  calculateTouringPlanSpotTimes,
  PLAN_SPOT_TIME_BASE_DATE,
} from './calculateTouringPlanSpotTimes'

/**
 * 2つの日時が同一かどうかを判定する。
 *
 * @remarks
 * 両方が `null` の場合は一致とみなす。
 */
function isSameDateTime(a: Date | null, b: Date | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return a.getTime() === b.getTime()
}

/**
 * ツーリングプランの各スポットの予定到着時刻・予定出発時刻を再計算し、
 * 変更があれば永続化する。
 *
 * @remarks
 * 1. プランの全スポットを取得し、`START → SPOT/BREAK(sortOrder昇順) → DESTINATION`
 *    の順に並び替える。
 * 2. {@link PLAN_SPOT_TIME_BASE_DATE} を起点として
 *    {@link calculateTouringPlanSpotTimes} で各スポットの予定到着時刻・予定出発時刻を計算する。
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
    PLAN_SPOT_TIME_BASE_DATE,
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
      isSameDateTime(spot.plannedArrivalAt, computed.plannedArrivalAt) &&
      isSameDateTime(spot.plannedDepartureAt, computed.plannedDepartureAt)
    ) {
      continue
    }

    await touringPlanSpotRepository.updatePlanSpot(
      new TouringPlanSpotEntity({
        ...spot.toJson(),
        plannedArrivalAt: computed.plannedArrivalAt,
        plannedDepartureAt: computed.plannedDepartureAt,
      })
    )
  }
}
