import { TouringPlanId, TouringPlanSpotId } from '@repo/shared-types'
import { TouringPlanSpotEntity } from '../entities/TouringPlanSpotEntity'

/**
 * START/DESTINATION のupsert・解除を1メソッドで扱うためのデータ型
 *
 * @remarks
 * `data` に `null` を渡すと該当 `type` のスポットを削除する。
 */
export type SingletonTouringPlanSpotData = {
  name: string | null
  memo: string | null
  latitude: number | null
  longitude: number | null
  plannedArrivalAt: Date | null
  plannedDepartureAt: Date | null
}

/**
 * ツーリングプランスポット（出発地・経由地・休憩・目的地）の永続化を担当するリポジトリ
 */
export interface ITouringPlanSpotRepository {
  createPlanSpot(spot: TouringPlanSpotEntity): Promise<TouringPlanSpotEntity>
  findPlanSpotsByPlanId(planId: TouringPlanId): Promise<TouringPlanSpotEntity[]>
  findPlanSpotById(
    spotId: TouringPlanSpotId,
    planId: TouringPlanId
  ): Promise<TouringPlanSpotEntity | null>
  findPlanSpotByType(
    planId: TouringPlanId,
    type: 'START' | 'DESTINATION'
  ): Promise<TouringPlanSpotEntity | null>
  updatePlanSpot(spot: TouringPlanSpotEntity): Promise<TouringPlanSpotEntity>
  deletePlanSpot(
    spotId: TouringPlanSpotId,
    planId: TouringPlanId
  ): Promise<void>
  reorderPlanSpots(
    spotIds: TouringPlanSpotId[],
    planId: TouringPlanId
  ): Promise<void>
  shiftSortOrdersFrom(
    planId: TouringPlanId,
    fromSortOrder: number
  ): Promise<void>
  /**
   * START/DESTINATION スポットのupsert・解除を1メソッドで扱う
   *
   * @param data `null` を指定すると該当 `type` のスポットを削除する
   */
  upsertSingletonSpot(
    planId: TouringPlanId,
    type: 'START' | 'DESTINATION',
    data: SingletonTouringPlanSpotData | null
  ): Promise<TouringPlanSpotEntity | null>
}
