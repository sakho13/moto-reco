import {
  BikeId,
  createMyUserBikeId,
  createUserBikeId,
  UserId,
} from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'
import { BikeEntity } from '../entities/BikeEntity'
import { MyUserBikeEntity } from '../entities/MyUserBikeEntity'
import { UserBikeEntity } from '../entities/UserBikeEntity'
import { UserEntity } from '../entities/UserEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IBikeRepository } from '../interfaces/IBikeRepository'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { IUserBikeRepository } from '../interfaces/IUserBikeRepository'

type RegisterUserBikeParams = {
  bikeId?: BikeId | null
  displacement?: number
  serialNumber?: string | null
  user: UserEntity
  nickname?: string
  purchaseDate?: Date
  purchasePrice?: number | null
  purchaseMileage?: number | null
  totalMileage?: number
}

type UpdateMyUserBikeParams = {
  myUserBikeId: ReturnType<typeof createMyUserBikeId>
  userId: UserId
  nickname?: string | null
  purchaseDate?: Date | null
  purchasePrice?: number | null
  purchaseMileage?: number | null
  displacement?: number
  totalMileage?: number | null
}

export class UserBikeService {
  constructor(
    private userBikeRepository: IUserBikeRepository,
    private myUserBikeRepository: IMyUserBikeRepository,
    private bikeRepository: IBikeRepository
  ) {}

  public async registerUserBike(params: RegisterUserBikeParams) {
    const limits = params.user.limits
    if (limits.bike !== null) {
      const currentCount = await this.myUserBikeRepository.countOwnedBikes(
        params.user.id
      )
      if (limits.isOver('bike', currentCount)) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          limits.limitMessage('bike')
        )
      }
    }

    let bike: BikeEntity | null = null
    if (params.bikeId) {
      bike = await this.bikeRepository.findById(params.bikeId)
      if (!bike) {
        throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
      }
    }

    const displacement = bike?.displacement ?? params.displacement
    if (displacement === undefined) {
      throw new ApiV1Error('INVALID_REQUEST', '排気量を指定してください')
    }

    const totalMileage = params.totalMileage ?? params.purchaseMileage ?? 0

    const userBike = await this.userBikeRepository.createUserBike(
      new UserBikeEntity({
        bikeId: bike?.id ?? null,
        userBikeId: createUserBikeId(''),
        displacement,
        totalMileage,
        serialNumber: params.serialNumber ?? null,
      })
    )

    const myUserBike = await this.myUserBikeRepository.createMyUserBike(
      new MyUserBikeEntity({
        bikeId: userBike.bikeId,
        userBikeId: userBike.id,
        displacement: userBike.displacement,
        totalMileage: userBike.totalMileage,
        serialNumber: userBike.serialNumber,
        myUserBikeId: createMyUserBikeId(''),
        userId: params.user.id,
        nickname: params.nickname ?? null,
        purchaseDate: params.purchaseDate ?? null,
        purchasePrice: params.purchasePrice ?? null,
        purchaseMileage: params.purchaseMileage ?? null,
        ownedAt: params.purchaseDate ?? getCurrentDate(),
        soldAt: null,
        ownStatus: 'OWN',
      })
    )

    return { userBike, myUserBike }
  }

  public async getMyUserBikeDetail(myUserBikeId: string, userId: UserId) {
    const detail = await this.myUserBikeRepository.findMyUserBikeDetail(
      createMyUserBikeId(myUserBikeId),
      userId
    )

    if (!detail) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    return detail
  }

  public async updateMyUserBike(params: UpdateMyUserBikeParams) {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const current = myUserBike.toJson()

    if (params.displacement !== undefined) {
      if (current.bikeId) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          '登録済みバイクの排気量は変更できません'
        )
      }
      await this.userBikeRepository.updateUserBikeDisplacement(
        current.userBikeId,
        params.displacement
      )
    }

    if (params.totalMileage !== undefined && params.totalMileage !== null) {
      await this.userBikeRepository.updateTotalMileage(
        current.userBikeId,
        params.totalMileage
      )
    }

    const updatedEntity = new MyUserBikeEntity({
      ...current,
      nickname:
        params.nickname !== undefined ? params.nickname : current.nickname,
      purchaseDate:
        params.purchaseDate !== undefined
          ? params.purchaseDate
          : current.purchaseDate,
      purchasePrice:
        params.purchasePrice !== undefined
          ? params.purchasePrice
          : current.purchasePrice,
      purchaseMileage:
        params.purchaseMileage !== undefined
          ? params.purchaseMileage
          : current.purchaseMileage,
    })

    await this.myUserBikeRepository.updateMyUserBike(updatedEntity)

    return this.getMyUserBikeDetail(params.myUserBikeId, params.userId)
  }
}
