import { createFuelLogId, MyUserBikeId, UserId } from '@shared-types/index'
import { IFuelLogRepository } from '../../interfaces/IFuelLogRepository'
import { IMyUserBikeRepository } from '../../interfaces/IMyUserBikeRepository'
import { ApiV1Error } from '../common/ApiV1Error'
import { FuelLogEntity } from '../entities/FuelLogEntity'
import { MyUserBikeEntity } from '../entities/MyUserBikeEntity'

type RegisterFuelLogParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  refueledAt: Date
  mileage: number
  amount: number
  totalPrice: number
  updateTotalMileage: boolean
}

export class FuelLogService {
  constructor(
    private fuelLogRepository: IFuelLogRepository,
    private myUserBikeRepository: IMyUserBikeRepository
  ) {}

  public async registerFuelLog(
    params: RegisterFuelLogParams
  ): Promise<FuelLogEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const fuelLog = new FuelLogEntity({
      fuelLogId: createFuelLogId(''),
      myUserBikeId: params.myUserBikeId,
      refueledAt: params.refueledAt,
      mileage: params.mileage,
      amount: params.amount,
      totalPrice: params.totalPrice,
    })

    const createdFuelLog = await this.fuelLogRepository.createFuelLog(fuelLog)

    if (params.updateTotalMileage && params.mileage > myUserBike.totalMileage) {
      const current = myUserBike.toJson()
      const updatedEntity = new MyUserBikeEntity({
        ...current,
        totalMileage: params.mileage,
      })
      await this.myUserBikeRepository.updateMyUserBike(updatedEntity)
    }

    return createdFuelLog
  }
}
