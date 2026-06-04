import {
  createSpotId,
  MyUserBikeId,
  SpotId,
  SpotType,
  TouringId,
  UserId,
} from '@repo/shared-types'
import type { SpotReorderRequest } from '@repo/shared-types'
import { SpotEntity } from '../entities/SpotEntity'
import { TouringEntity } from '../entities/TouringEntity'
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
  visitedAt?: Date
  endAt?: Date
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
  visitedAt?: Date
  endAt?: Date | null
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
      const spot = new SpotEntity({
        spotId: createSpotId(''),
        touringId: params.touringId,
        type: params.type ?? 'SPOT',
        name: params.name ?? null,
        memo: params.memo ?? null,
        latitude: params.latitude ?? null,
        longitude: params.longitude ?? null,
        visitedAt: params.visitedAt ?? new Date(),
        endAt: params.endAt ?? null,
        sortOrder: 0, // createSpot でカウントして末尾に設定される
      })

      const created = await this.spotRepository.createSpot(spot)
      await this._syncPlanEndDate(params.touringId, touring)
      return created
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
        visitedAt: params.visitedAt ?? existingSpot.visitedAt,
        endAt: params.endAt !== undefined ? params.endAt : existingSpot.endAt,
        sortOrder: existingSpot.sortOrder,
      })

      const updated = await this.spotRepository.updateSpot(updatedSpot)
      await this._syncPlanEndDate(params.touringId, touring)
      return updated
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
    await this._syncPlanEndDate(touringId, touring)
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

  private async _syncPlanEndDate(
    touringId: TouringId,
    touring: TouringEntity
  ): Promise<void> {
    if (touring.status !== 'PLANNED') return

    const spots = await this.spotRepository.findSpotsByTouringId(touringId)
    const newEndDate =
      spots.length > 0
        ? new Date(Math.max(...spots.map((s) => s.visitedAt.getTime())))
        : touring.startDate

    if (newEndDate.getTime() === touring.endDate.getTime()) return

    await this.touringRepository.updateTouring(
      new TouringEntity({ ...touring.toJson(), endDate: newEndDate })
    )
  }
}
