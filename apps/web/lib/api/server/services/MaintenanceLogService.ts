import {
  MaintenanceLogEntity,
  UserEntity,
  ApiV1Error,
  IMaintenanceLogRepository,
  IMyUserBikeRepository,
  MaintenanceLogSearchParams,
} from '@repo/shared-domain'
import {
  createMaintenanceLogId,
  MaintenanceLogId,
  MaintenanceLogItem,
  MyUserBikeId,
  UserId,
} from '@repo/shared-types'

type GetMaintenanceLogsParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  searchParams: MaintenanceLogSearchParams
}

type GetAllMaintenanceLogsParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  sortOrder?: 'asc' | 'desc'
}

type RegisterMaintenanceLogParams = {
  myUserBikeId: MyUserBikeId
  user: UserEntity
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

    return this.maintenanceLogRepository.findMaintenanceLogs(
      params.myUserBikeId,
      params.searchParams
    )
  }

  /**
   * ページングで打ち切らず全件のメンテナンス履歴を取得する。
   * @remarks
   * MaintenanceLogSearchParams経由のfindMaintenanceLogsはpageSizeが
   * 一覧APIの負荷対策として100件に丸められるため、全履歴を必要とする
   * 集計処理では専用のfindAllMaintenanceLogs（単一クエリ）を使う。
   */
  public async getAllMaintenanceLogs(
    params: GetAllMaintenanceLogsParams
  ): Promise<MaintenanceLogEntity[]> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    return this.maintenanceLogRepository.findAllMaintenanceLogs(
      params.myUserBikeId,
      params.sortOrder ?? 'desc'
    )
  }

  public async registerMaintenanceLog(
    params: RegisterMaintenanceLogParams
  ): Promise<MaintenanceLogEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.user.id
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const limits = params.user.limits
    if (limits.maintenanceLog !== null) {
      const count = await this.maintenanceLogRepository.countMaintenanceLogs(
        params.myUserBikeId
      )
      if (limits.isOver('maintenanceLog', count)) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          limits.limitMessage('maintenanceLog')
        )
      }
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
      await this.myUserBikeRepository.updateTotalMileage(
        myUserBike.userBikeId,
        params.mileage
      )
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
        await this.myUserBikeRepository.updateTotalMileage(
          myUserBike.userBikeId,
          result.mileage
        )
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
