import {
  createSpotId,
  MyUserBikeId,
  SpotId,
  SpotType,
  TouringId,
  UserId,
} from '@repo/shared-types'
import type { SpotReorderRequest } from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'
import { SpotEntity } from '../entities/SpotEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { ISpotRepository } from '../interfaces/ISpotRepository'
import { ITouringRepository } from '../interfaces/ITouringRepository'

type RegisterSpotParams = {
  touringId: TouringId
  myUserBikeId: MyUserBikeId
  userId: UserId
  type?: SpotType
  name?: string
  memo?: string
  latitude?: number
  longitude?: number
  arrivedAt?: Date
  departedAt?: Date
}

type UpdateSpotParams = {
  spotId: SpotId
  touringId: TouringId
  myUserBikeId: MyUserBikeId
  userId: UserId
  name?: string | null
  memo?: string | null
  latitude?: number | null
  longitude?: number | null
  arrivedAt?: Date | null
  departedAt?: Date | null
  isSkipped?: boolean
}

export class SpotService {
  constructor(
    private spotRepository: ISpotRepository,
    private touringRepository: ITouringRepository,
    private myUserBikeRepository: IMyUserBikeRepository
  ) {}

  public async registerSpot(params: RegisterSpotParams): Promise<SpotEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const touring = await this.touringRepository.findTouringById(
      params.touringId,
      params.myUserBikeId
    )

    if (!touring) {
      throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
    }

    try {
      // 到着日時は常に指定値、未指定の場合は現在時刻（実績は常にこの意味）
      const arrivedAt = params.arrivedAt ?? getCurrentDate()

      const spotType = params.type ?? 'SPOT'

      const existingSpots = await this.spotRepository.findSpotsByTouringId(
        params.touringId
      )
      let sortOrder = existingSpots.length

      // SPOTを記録する場合、次の未到着スポットの前に挿入する
      if (spotType === 'SPOT') {
        const nextUnvisited =
          existingSpots
            .filter(
              (s) => s.type === 'SPOT' && s.arrivedAt === null && !s.isSkipped
            )
            .sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null

        if (nextUnvisited !== null) {
          await this.spotRepository.shiftSortOrdersFrom(
            params.touringId,
            nextUnvisited.sortOrder
          )
          sortOrder = nextUnvisited.sortOrder
        }
      }

      const spot = new SpotEntity({
        spotId: createSpotId(''),
        touringId: params.touringId,
        type: spotType,
        name: params.name ?? null,
        memo: params.memo ?? null,
        latitude: params.latitude ?? null,
        longitude: params.longitude ?? null,
        plannedArrivalAt: null,
        plannedDepartureAt: null,
        arrivedAt,
        departedAt: params.departedAt ?? null,
        isSkipped: false,
        skippedAt: null,
        sortOrder,
      })

      return await this.spotRepository.createSpot(spot)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  public async getSpots(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<SpotEntity[]> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const touring = await this.touringRepository.findTouringById(
      touringId,
      myUserBikeId
    )

    if (!touring) {
      throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
    }

    return await this.spotRepository.findSpotsByTouringId(touringId)
  }

  public async updateSpot(params: UpdateSpotParams): Promise<SpotEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const touring = await this.touringRepository.findTouringById(
      params.touringId,
      params.myUserBikeId
    )

    if (!touring) {
      throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
    }

    const existingSpot = await this.spotRepository.findSpotById(
      params.spotId,
      params.touringId
    )

    if (!existingSpot) {
      throw new ApiV1Error('NOT_FOUND', '指定されたスポットが見つかりません')
    }

    try {
      // isSkippedの変更に応じてskippedAtをサーバ側で設定する
      const isSkipped =
        params.isSkipped !== undefined
          ? params.isSkipped
          : existingSpot.isSkipped
      let skippedAt = existingSpot.skippedAt
      if (params.isSkipped !== undefined) {
        skippedAt = params.isSkipped ? getCurrentDate() : null
      }

      const updatedSpot = new SpotEntity({
        spotId: existingSpot.id,
        touringId: existingSpot.touringId,
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
        arrivedAt:
          params.arrivedAt !== undefined
            ? params.arrivedAt
            : existingSpot.arrivedAt,
        departedAt:
          params.departedAt !== undefined
            ? params.departedAt
            : existingSpot.departedAt,
        isSkipped,
        skippedAt,
        sortOrder: existingSpot.sortOrder,
      })

      return await this.spotRepository.updateSpot(updatedSpot)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  public async deleteSpot(
    spotId: SpotId,
    touringId: TouringId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<void> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const touring = await this.touringRepository.findTouringById(
      touringId,
      myUserBikeId
    )

    if (!touring) {
      throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
    }

    const existingSpot = await this.spotRepository.findSpotById(
      spotId,
      touringId
    )

    if (!existingSpot) {
      throw new ApiV1Error('NOT_FOUND', '指定されたスポットが見つかりません')
    }

    await this.spotRepository.deleteSpot(spotId, touringId)
  }

  public async reorderSpots(
    spotIds: SpotReorderRequest['spotIds'],
    touringId: TouringId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<void> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const touring = await this.touringRepository.findTouringById(
      touringId,
      myUserBikeId
    )

    if (!touring) {
      throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
    }

    await this.spotRepository.reorderSpots(
      spotIds.map((id) => createSpotId(id)),
      touringId
    )
  }
}
