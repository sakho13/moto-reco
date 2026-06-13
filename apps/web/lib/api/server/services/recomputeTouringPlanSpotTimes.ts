import { TouringPlanId } from '@repo/shared-types'
import { TouringPlanEntity } from '../entities/TouringPlanEntity'
import { TouringPlanSpotEntity } from '../entities/TouringPlanSpotEntity'
import { ITouringPlanRepository } from '../interfaces/ITouringPlanRepository'
import { ITouringPlanSpotRepository } from '../interfaces/ITouringPlanSpotRepository'
import { calculateTouringPlanSpotTimes } from './calculateTouringPlanSpotTimes'

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
 * ツーリングプランの各スポットの予定到着時刻・予定出発時刻、および
 * プラン全体の帰着予定日時（`returnAt`）を再計算し、変更があれば永続化する。
 *
 * @remarks
 * 1. プランの全スポットを取得し、`START → SPOT/BREAK(sortOrder昇順) → DESTINATION`
 *    の順に並び替える。
 * 2. {@link calculateTouringPlanSpotTimes} で各スポットの予定到着時刻・予定出発時刻を計算する。
 * 3. 計算結果が既存値と異なるスポットのみ更新する。
 * 4. 計算結果から `returnAt` を算出し、`plan.returnAt` と異なる場合のみプランを更新する。
 *
 * @param touringPlanSpotRepository - ツーリングプランスポットリポジトリ
 * @param touringPlanRepository - ツーリングプランリポジトリ
 * @param planId - 対象のツーリングプランID
 * @param plan - 対象のツーリングプランエンティティ
 * @returns 更新後（変更が無かった場合は元の）ツーリングプランエンティティ
 */
export async function recomputeTouringPlanSpotTimes(
  touringPlanSpotRepository: ITouringPlanSpotRepository,
  touringPlanRepository: ITouringPlanRepository,
  planId: TouringPlanId,
  plan: TouringPlanEntity
): Promise<TouringPlanEntity> {
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
    plan.departAt,
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

  const allComputedTimes = computedTimes
    .flatMap((c) => [c.plannedArrivalAt, c.plannedDepartureAt])
    .filter((d): d is Date => d !== null)

  const newReturnAt =
    allComputedTimes.length > 0
      ? new Date(
          Math.max(
            plan.departAt.getTime(),
            ...allComputedTimes.map((d) => d.getTime())
          )
        )
      : plan.departAt

  if (newReturnAt.getTime() === plan.returnAt.getTime()) {
    return plan
  }

  return touringPlanRepository.updatePlan(
    new TouringPlanEntity({ ...plan.toJson(), returnAt: newReturnAt })
  )
}
