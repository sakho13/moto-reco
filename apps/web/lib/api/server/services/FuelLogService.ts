import {
  createFuelLogId,
  FuelLogId,
  MyUserBikeId,
  UserId,
} from '@repo/shared-types'
import { FuelLogEntity } from '../entities/FuelLogEntity'
import { MyUserBikeEntity } from '../entities/MyUserBikeEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IFuelLogRepository } from '../interfaces/IFuelLogRepository'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { FuelLogSearchParams } from '../valueObjects/FuelLogSearchParams'

type RegisterFuelLogParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  refueledAt: Date
  mileage: number
  previousMileage: number
  amount: number
  totalPrice: number
  updateTotalMileage: boolean
}

type UpdateFuelLogParams = {
  fuelLogId: FuelLogId
  myUserBikeId: MyUserBikeId
  userId: UserId
  refueledAt?: Date
  mileage?: number
  previousMileage?: number
  amount?: number
  totalPrice?: number
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
      previousMileage: params.previousMileage,
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

  public async getFuelLogs(
    myUserBikeId: MyUserBikeId,
    userId: UserId,
    searchParams: FuelLogSearchParams
  ): Promise<FuelLogEntity[]> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    return await this.fuelLogRepository.findFuelLogs(myUserBikeId, searchParams)
  }

  public async updateFuelLog(
    params: UpdateFuelLogParams
  ): Promise<FuelLogEntity> {
    // 1. バイクの所有権確認
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    // 2. 燃料ログの存在確認と所有権確認
    const existingFuelLog = await this.fuelLogRepository.findFuelLogById(
      params.fuelLogId,
      params.myUserBikeId
    )

    if (!existingFuelLog) {
      throw new ApiV1Error('NOT_FOUND', '指定された燃料ログが見つかりません')
    }

    // 3. 部分更新のためのマージ処理
    try {
      const updatedFuelLog = new FuelLogEntity({
        fuelLogId: existingFuelLog.id,
        myUserBikeId: existingFuelLog.myUserBikeId,
        refueledAt: params.refueledAt ?? existingFuelLog.refueledAt,
        mileage: params.mileage ?? existingFuelLog.mileage,
        previousMileage:
          params.previousMileage ?? existingFuelLog.previousMileage,
        amount: params.amount ?? existingFuelLog.amount,
        totalPrice: params.totalPrice ?? existingFuelLog.totalPrice,
      })

      // 4. 更新実行
      return await this.fuelLogRepository.updateFuelLog(updatedFuelLog)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }
}
