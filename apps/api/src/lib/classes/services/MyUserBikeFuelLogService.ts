import {
  createMyUserBikeFuelLogId,
  MyUserBikeId,
  UserId,
} from '@shared-types/index'
import { IMyUserBikeFuelLogRepository } from '../../interfaces/IMyUserBikeFuelLogRepository'
import { IMyUserBikeRepository } from '../../interfaces/IMyUserBikeRepository'
import { ApiV1Error } from '../common/ApiV1Error'
import { MyUserBikeFuelLogEntity } from '../entities/MyUserBikeFuelLogEntity'

type RegisterFuelLogParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  refueledAt: Date
  mileage: number
  amount: number
  totalPrice: number
  updateTotalMileage?: boolean
}

export class MyUserBikeFuelLogService {
  constructor(
    private myUserBikeRepository: IMyUserBikeRepository,
    private myUserBikeFuelLogRepository: IMyUserBikeFuelLogRepository
  ) {}

  public async registerFuelLog({
    myUserBikeId,
    userId,
    refueledAt,
    mileage,
    amount,
    totalPrice,
    updateTotalMileage,
  }: RegisterFuelLogParams) {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたユーザー所有バイクが見つかりません')
    }

    const fuelLog = await this.myUserBikeFuelLogRepository.createFuelLog(
      myUserBikeId,
      new MyUserBikeFuelLogEntity({
        fuelLogId: createMyUserBikeFuelLogId(''),
        myUserBikeId,
        refueledAt,
        mileage,
        amount,
        totalPrice,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    )

    if (updateTotalMileage && mileage >= myUserBike.totalMileage) {
      await this.myUserBikeRepository.updateTotalMileage(myUserBikeId, mileage)
    }

    return fuelLog
  }
}
