import {
  createFuelLogId,
  FuelLogId,
  MyUserBikeId,
  UserId,
} from '@repo/shared-types'
import { FuelLogEntity } from '../entities/FuelLogEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IFuelLogRepository } from '../interfaces/IFuelLogRepository'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { IUserBikeRepository } from '../interfaces/IUserBikeRepository'
import { FuelLogSearchParams } from '../valueObjects/FuelLogSearchParams'

type RegisterFuelLogParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  refueledAt: Date
  mileage: number
  previousMileage: number
  amount: number
  totalPrice: number
  memo?: string | null
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
  memo?: string | null
}

type DeleteFuelLogParams = {
  fuelLogId: FuelLogId
  myUserBikeId: MyUserBikeId
  userId: UserId
}

export class FuelLogService {
  constructor(
    private fuelLogRepository: IFuelLogRepository,
    private myUserBikeRepository: IMyUserBikeRepository,
    private userBikeRepository: IUserBikeRepository
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
      memo: params.memo ?? null,
      touringId: null,
      touringTitle: null,
    })

    const createdFuelLog = await this.fuelLogRepository.createFuelLog(fuelLog)

    if (params.updateTotalMileage) {
      await this.userBikeRepository.updateTotalMileageIfGreater(
        myUserBike.userBikeId,
        params.mileage
      )
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

  public async getFuelLogDetail(
    fuelLogId: FuelLogId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<FuelLogEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const fuelLog = await this.fuelLogRepository.findFuelLogById(
      fuelLogId,
      myUserBikeId
    )

    if (!fuelLog) {
      throw new ApiV1Error('NOT_FOUND', '指定された燃料ログが見つかりません')
    }

    return fuelLog
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
        memo: params.memo ?? existingFuelLog.memo,
        touringId: existingFuelLog.touringId,
        touringTitle: existingFuelLog.touringTitle,
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

  public async deleteFuelLog(params: DeleteFuelLogParams): Promise<void> {
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

    // 3. 物理削除を実行（総走行距離の更新は行わない）
    await this.fuelLogRepository.deleteFuelLog(
      params.fuelLogId,
      params.myUserBikeId
    )
  }
}
