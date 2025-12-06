import { BikeId, createMyUserBikeId, createUserBikeId, UserId } from '@shared-types/index'
import { IBikeRepository } from '../../interfaces/IBikeRepository'
import { IMyUserBikeRepository } from '../../interfaces/IMyUserBikeRepository'
import { IUserBikeRepository } from '../../interfaces/IUserBikeRepository'
import { ApiV1Error } from '../common/ApiV1Error'
import { MyUserBikeEntity } from '../entities/MyUserBikeEntity'
import { UserBikeEntity } from '../entities/UserBikeEntity'

type RegisterUserBikeParams = {
  bikeId: BikeId
  serialNumber?: string
  userId: UserId
  nickname?: string
  purchaseDate?: Date
  purchasePrice?: number
  purchaseMileage?: number
  totalMileage?: number
}

export class UserBikeService {
  constructor(
    private userBikeRepository: IUserBikeRepository,
    private myUserBikeRepository: IMyUserBikeRepository,
    private bikeRepository: IBikeRepository
  ) {}

  public async registerUserBike(params: RegisterUserBikeParams) {
    const bike = await this.bikeRepository.findById(params.bikeId)
    if (!bike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const userBike = await this.userBikeRepository.createUserBike(
      new UserBikeEntity({
        bikeId: bike.id,
        userBikeId: createUserBikeId(''),
        serialNumber: params.serialNumber ?? null,
      })
    )

    const totalMileage = params.totalMileage ?? params.purchaseMileage ?? 0

    const myUserBike = await this.myUserBikeRepository.createMyUserBike(
      new MyUserBikeEntity({
        bikeId: userBike.bikeId,
        userBikeId: userBike.id,
        myUserBikeId: createMyUserBikeId(''),
        userId: params.userId,
        nickname: params.nickname ?? null,
        purchaseDate: params.purchaseDate ?? null,
        purchasePrice: params.purchasePrice ?? null,
        purchaseMileage: params.purchaseMileage ?? null,
        totalMileage,
        ownedAt: params.purchaseDate ?? new Date(),
        soldAt: null,
        ownStatus: 'OWN',
      })
    )

    return { userBike, myUserBike }
  }
}
