import {
  createTouringPlanSpotId,
  MyUserBikeId,
  TouringPlanId,
  TouringPlanRouteType,
  TouringPlanSpotId,
  UserId,
} from '@repo/shared-types'
import type { TouringPlanSpotReorderRequest } from '@repo/shared-types'
import { TouringPlanEntity } from '../entities/TouringPlanEntity'
import { TouringPlanSpotEntity } from '../entities/TouringPlanSpotEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { ITouringPlanRepository } from '../interfaces/ITouringPlanRepository'
import { ITouringPlanSpotRepository } from '../interfaces/ITouringPlanSpotRepository'
import { recomputeTouringPlanSpotTimes } from './recomputeTouringPlanSpotTimes'

type RegisterPlanSpotParams = {
  planId: TouringPlanId
  myUserBikeId: MyUserBikeId
  userId: UserId
  type: 'SPOT' | 'BREAK'
  name?: string
  memo?: string
  latitude?: number
  longitude?: number
  stayMinutes?: number
  travelMinutesFromPrev?: number
  routeTypeFromPrev?: TouringPlanRouteType
}

type UpdatePlanSpotParams = {
  spotId: TouringPlanSpotId
  planId: TouringPlanId
  myUserBikeId: MyUserBikeId
  userId: UserId
  name?: string | null
  memo?: string | null
  latitude?: number | null
  longitude?: number | null
  stayMinutes?: number | null
  travelMinutesFromPrev?: number | null
  routeTypeFromPrev?: TouringPlanRouteType | null
}

/**
 * ツーリングプランのロケーション（出発地・経由地・休憩・目的地）に関する
 * ビジネスロジックを実装するサービス
 */
export class TouringPlanSpotService {
  constructor(
    private touringPlanSpotRepository: ITouringPlanSpotRepository,
    private touringPlanRepository: ITouringPlanRepository,
    private myUserBikeRepository: IMyUserBikeRepository
  ) {}

  /**
   * 経由地・休憩（SPOT/BREAK）をプランの末尾に追加する
   */
  public async registerPlanSpot(
    params: RegisterPlanSpotParams
  ): Promise<TouringPlanSpotEntity> {
    const plan = await this._findPlanOrThrow(
      params.planId,
      params.myUserBikeId,
      params.userId
    )

    try {
      const existingSpots =
        await this.touringPlanSpotRepository.findPlanSpotsByPlanId(
          params.planId
        )

      // SPOT/BREAKのみを対象にsortOrderを採番（末尾に追加）
      const waypointCount = existingSpots.filter(
        (s) => s.type === 'SPOT' || s.type === 'BREAK'
      ).length

      const spot = new TouringPlanSpotEntity({
        touringPlanSpotId: createTouringPlanSpotId(''),
        touringPlanId: params.planId,
        type: params.type,
        name: params.name ?? null,
        memo: params.memo ?? null,
        latitude: params.latitude ?? null,
        longitude: params.longitude ?? null,
        plannedArrivalAt: null,
        plannedDepartureAt: null,
        stayMinutes: params.stayMinutes ?? null,
        travelMinutesFromPrev: params.travelMinutesFromPrev ?? null,
        routeTypeFromPrev: params.routeTypeFromPrev ?? null,
        sortOrder: waypointCount,
      })

      const created = await this.touringPlanSpotRepository.createPlanSpot(spot)
      await recomputeTouringPlanSpotTimes(
        this.touringPlanSpotRepository,
        this.touringPlanRepository,
        params.planId,
        plan
      )
      return created
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  /**
   * プランのロケーション一覧（出発地→経由地・休憩→目的地）を取得する
   */
  public async getPlanSpots(
    planId: TouringPlanId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<TouringPlanSpotEntity[]> {
    await this._findPlanOrThrow(planId, myUserBikeId, userId)

    const spots =
      await this.touringPlanSpotRepository.findPlanSpotsByPlanId(planId)

    const startSpot = spots.find((s) => s.type === 'START')
    const destinationSpot = spots.find((s) => s.type === 'DESTINATION')
    const waypoints = spots
      .filter((s) => s.type === 'SPOT' || s.type === 'BREAK')
      .sort((a, b) => a.sortOrder - b.sortOrder)

    return [
      ...(startSpot ? [startSpot] : []),
      ...waypoints,
      ...(destinationSpot ? [destinationSpot] : []),
    ]
  }

  /**
   * 経由地・休憩（SPOT/BREAK）を更新する
   */
  public async updatePlanSpot(
    params: UpdatePlanSpotParams
  ): Promise<TouringPlanSpotEntity> {
    const plan = await this._findPlanOrThrow(
      params.planId,
      params.myUserBikeId,
      params.userId
    )

    const existingSpot = await this.touringPlanSpotRepository.findPlanSpotById(
      params.spotId,
      params.planId
    )

    if (!existingSpot) {
      throw new ApiV1Error('NOT_FOUND', '指定されたスポットが見つかりません')
    }

    if (existingSpot.type !== 'SPOT' && existingSpot.type !== 'BREAK') {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        '出発地・目的地はこのAPIから更新できません'
      )
    }

    try {
      const updatedSpot = new TouringPlanSpotEntity({
        touringPlanSpotId: existingSpot.id,
        touringPlanId: existingSpot.touringPlanId,
        type: existingSpot.type,
        name: params.name !== undefined ? params.name : existingSpot.name,
        memo: params.memo !== undefined ? params.memo : existingSpot.memo,
        latitude:
          params.latitude !== undefined
            ? params.latitude
            : existingSpot.latitude,
        longitude:
          params.longitude !== undefined
            ? params.longitude
            : existingSpot.longitude,
        plannedArrivalAt: existingSpot.plannedArrivalAt,
        plannedDepartureAt: existingSpot.plannedDepartureAt,
        stayMinutes:
          params.stayMinutes !== undefined
            ? params.stayMinutes
            : existingSpot.stayMinutes,
        travelMinutesFromPrev:
          params.travelMinutesFromPrev !== undefined
            ? params.travelMinutesFromPrev
            : existingSpot.travelMinutesFromPrev,
        routeTypeFromPrev:
          params.routeTypeFromPrev !== undefined
            ? params.routeTypeFromPrev
            : existingSpot.routeTypeFromPrev,
        sortOrder: existingSpot.sortOrder,
      })

      const updated =
        await this.touringPlanSpotRepository.updatePlanSpot(updatedSpot)
      await recomputeTouringPlanSpotTimes(
        this.touringPlanSpotRepository,
        this.touringPlanRepository,
        params.planId,
        plan
      )
      return updated
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  /**
   * 経由地・休憩（SPOT/BREAK）を削除する
   */
  public async deletePlanSpot(
    spotId: TouringPlanSpotId,
    planId: TouringPlanId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<void> {
    const plan = await this._findPlanOrThrow(planId, myUserBikeId, userId)

    const existingSpot = await this.touringPlanSpotRepository.findPlanSpotById(
      spotId,
      planId
    )

    if (!existingSpot) {
      throw new ApiV1Error('NOT_FOUND', '指定されたスポットが見つかりません')
    }

    if (existingSpot.type !== 'SPOT' && existingSpot.type !== 'BREAK') {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        '出発地・目的地はこのAPIから削除できません'
      )
    }

    await this.touringPlanSpotRepository.deletePlanSpot(spotId, planId)
    await recomputeTouringPlanSpotTimes(
      this.touringPlanSpotRepository,
      this.touringPlanRepository,
      planId,
      plan
    )
  }

  /**
   * 経由地・休憩（SPOT/BREAK）を並び替える
   */
  public async reorderPlanSpots(
    spotIds: TouringPlanSpotReorderRequest['spotIds'],
    planId: TouringPlanId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<void> {
    const plan = await this._findPlanOrThrow(planId, myUserBikeId, userId)

    await this.touringPlanSpotRepository.reorderPlanSpots(
      spotIds.map((id) => createTouringPlanSpotId(id)),
      planId
    )

    await recomputeTouringPlanSpotTimes(
      this.touringPlanSpotRepository,
      this.touringPlanRepository,
      planId,
      plan
    )
  }

  /**
   * 出発地（START）を設定・更新・解除する
   *
   * @param params `null` を指定すると出発地を未設定に戻す
   */
  public async setStartSpot(
    planId: TouringPlanId,
    myUserBikeId: MyUserBikeId,
    userId: UserId,
    params: {
      latitude: number
      longitude: number
      name?: string | null
      memo?: string | null
    } | null
  ): Promise<TouringPlanSpotEntity | null> {
    const plan = await this._findPlanOrThrow(planId, myUserBikeId, userId)

    try {
      const result = await this.touringPlanSpotRepository.upsertSingletonSpot(
        planId,
        'START',
        params === null
          ? null
          : {
              name: params.name ?? null,
              memo: params.memo ?? null,
              latitude: params.latitude,
              longitude: params.longitude,
              travelMinutesFromPrev: null,
              routeTypeFromPrev: null,
            }
      )

      await recomputeTouringPlanSpotTimes(
        this.touringPlanSpotRepository,
        this.touringPlanRepository,
        planId,
        plan
      )
      return result
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  /**
   * 目的地（DESTINATION）を設定・更新・解除する
   *
   * @param params `null` を指定すると目的地を未設定に戻す
   */
  public async setDestinationSpot(
    planId: TouringPlanId,
    myUserBikeId: MyUserBikeId,
    userId: UserId,
    params: {
      latitude: number
      longitude: number
      name?: string | null
      memo?: string | null
      travelMinutesFromPrev?: number | null
      routeTypeFromPrev?: TouringPlanRouteType | null
    } | null
  ): Promise<TouringPlanSpotEntity | null> {
    const plan = await this._findPlanOrThrow(planId, myUserBikeId, userId)

    try {
      const result = await this.touringPlanSpotRepository.upsertSingletonSpot(
        planId,
        'DESTINATION',
        params === null
          ? null
          : {
              name: params.name ?? null,
              memo: params.memo ?? null,
              latitude: params.latitude,
              longitude: params.longitude,
              travelMinutesFromPrev: params.travelMinutesFromPrev ?? null,
              routeTypeFromPrev: params.routeTypeFromPrev ?? null,
            }
      )

      await recomputeTouringPlanSpotTimes(
        this.touringPlanSpotRepository,
        this.touringPlanRepository,
        planId,
        plan
      )
      return result
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  /**
   * プランの存在確認（所有者チェック含む）
   */
  private async _findPlanOrThrow(
    planId: TouringPlanId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<TouringPlanEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const plan = await this.touringPlanRepository.findPlanById(
      planId,
      myUserBikeId
    )

    if (!plan) {
      throw new ApiV1Error(
        'NOT_FOUND',
        '指定されたツーリングプランが見つかりません'
      )
    }

    return plan
  }
}
