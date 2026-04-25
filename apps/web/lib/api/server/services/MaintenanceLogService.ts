import {
  createMaintenanceLogId,
  MaintenanceLogId,
  MaintenanceLogItem,
  MyUserBikeId,
  UserId,
} from '@repo/shared-types'
import { MaintenanceLogEntity } from '../entities/MaintenanceLogEntity'
import { MyUserBikeEntity } from '../entities/MyUserBikeEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IMaintenanceLogRepository } from '../interfaces/IMaintenanceLogRepository'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'

type GetMaintenanceLogsParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  page: number
  perSize: number
  sortOrder: 'asc' | 'desc'
}

type RegisterMaintenanceLogParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  performedAt: Date
  mileage: number
  memo?: string | null
  items: MaintenanceLogItem[]
  updateTotalMileage: boolean
}

type UpdateMaintenanceLogParams = {
  maintenanceLogId: MaintenanceLogId
  myUserBikeId: MyUserBikeId
  userId: UserId
  performedAt?: Date
  mileage?: number
  memo?: string | null
  items?: MaintenanceLogItem[]
  updateTotalMileage?: boolean
}

export class MaintenanceLogService {
  constructor(
    private maintenanceLogRepository: IMaintenanceLogRepository,
    private myUserBikeRepository: IMyUserBikeRepository
  ) {}

  public async getMaintenanceLogs(
    params: GetMaintenanceLogsParams
  ): Promise<MaintenanceLogEntity[]> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    return this.maintenanceLogRepository.findMaintenanceLogs({
      myUserBikeId: params.myUserBikeId,
      page: params.page,
      perSize: params.perSize,
      sortOrder: params.sortOrder,
    })
  }

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

    const created =
      await this.maintenanceLogRepository.createMaintenanceLog(maintenanceLog)

    if (params.updateTotalMileage && params.mileage > myUserBike.totalMileage) {
      const current = myUserBike.toJson()
      const updatedEntity = new MyUserBikeEntity({
        ...current,
        totalMileage: params.mileage,
      })
      await this.myUserBikeRepository.updateMyUserBike(updatedEntity)
    }

    return created
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

    const existingLog =
      await this.maintenanceLogRepository.findMaintenanceLogById(
        params.maintenanceLogId,
        params.myUserBikeId
      )

    if (!existingLog) {
      throw new ApiV1Error(
        'NOT_FOUND',
        '指定されたメンテナンス履歴が見つかりません'
      )
    }

    try {
      const updatedLog = new MaintenanceLogEntity({
        maintenanceLogId: existingLog.id,
        myUserBikeId: existingLog.myUserBikeId,
        performedAt: params.performedAt ?? existingLog.performedAt,
        mileage: params.mileage ?? existingLog.mileage,
        memo: params.memo ?? existingLog.memo,
        items: params.items ?? existingLog.items,
      })

      const result =
        await this.maintenanceLogRepository.updateMaintenanceLog(updatedLog)

      if (
        params.updateTotalMileage &&
        result.mileage > myUserBike.totalMileage
      ) {
        const current = myUserBike.toJson()
        const updatedEntity = new MyUserBikeEntity({
          ...current,
          totalMileage: result.mileage,
        })
        await this.myUserBikeRepository.updateMyUserBike(updatedEntity)
      }

      return result
    } catch (error) {
      if (error instanceof ApiV1Error) {
        throw error
      }
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }
}
