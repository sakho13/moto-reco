import {
  createMaintenanceLogId,
  MaintenanceLogId,
  MaintenanceLogItem,
  MyUserBikeId,
  UserId,
} from '@repo/shared-types'
import { MaintenanceLogEntity } from '../entities/MaintenanceLogEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IMaintenanceLogRepository } from '../interfaces/IMaintenanceLogRepository'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'

type RegisterMaintenanceLogParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  performedAt: Date
  mileage: number
  memo?: string | null
  items: MaintenanceLogItem[]
}

type UpdateMaintenanceLogParams = {
  maintenanceLogId: MaintenanceLogId
  myUserBikeId: MyUserBikeId
  userId: UserId
  performedAt?: Date
  mileage?: number
  memo?: string | null
  items?: MaintenanceLogItem[]
}

export class MaintenanceLogService {
  constructor(
    private maintenanceLogRepository: IMaintenanceLogRepository,
    private myUserBikeRepository: IMyUserBikeRepository
  ) {}

  public async registerMaintenanceLog(
    params: RegisterMaintenanceLogParams
  ): Promise<MaintenanceLogEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const maintenanceLog = new MaintenanceLogEntity({
      maintenanceLogId: createMaintenanceLogId(''),
      myUserBikeId: params.myUserBikeId,
      performedAt: params.performedAt,
      mileage: params.mileage,
      memo: params.memo ?? null,
      items: params.items,
    })

    return await this.maintenanceLogRepository.createMaintenanceLog(
      maintenanceLog
    )
  }

  public async updateMaintenanceLog(
    params: UpdateMaintenanceLogParams
  ): Promise<MaintenanceLogEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const existingMaintenanceLog =
      await this.maintenanceLogRepository.findMaintenanceLogById(
        params.maintenanceLogId,
        params.myUserBikeId
      )

    if (!existingMaintenanceLog) {
      throw new ApiV1Error('NOT_FOUND', '指定されたメンテナンス履歴が見つかりません')
    }

    try {
      const updatedMaintenanceLog = new MaintenanceLogEntity({
        maintenanceLogId: existingMaintenanceLog.id,
        myUserBikeId: existingMaintenanceLog.myUserBikeId,
        performedAt:
          params.performedAt ?? existingMaintenanceLog.performedAt,
        mileage: params.mileage ?? existingMaintenanceLog.mileage,
        memo: params.memo ?? existingMaintenanceLog.memo,
        items: params.items ?? existingMaintenanceLog.items,
      })

      return await this.maintenanceLogRepository.updateMaintenanceLog(
        updatedMaintenanceLog
      )
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }
}
