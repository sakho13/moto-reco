import {
  FuelLogEntity,
  UserEntity,
  ApiV1Error,
  IFuelLogRepository,
  IMyUserBikeRepository,
  ITouringRepository,
  IUserBikeRepository,
  FuelLogSearchParams,
  FuelEfficiencyCalculationService,
} from '@repo/shared-domain'
import {
  createFuelLogId,
  FuelLogId,
  MyUserBikeId,
  TouringId,
  UserId,
} from '@repo/shared-types'

type RegisterFuelLogParams = {
  myUserBikeId: MyUserBikeId
  user: UserEntity
  refueledAt: Date
  mileage: number
  previousMileage: number
  amount: number
  totalPrice: number
  isFullTank: boolean
  memo?: string | null
  updateTotalMileage: boolean
  touringId?: string | null
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
  isFullTank?: boolean
  memo?: string | null
}

type DeleteFuelLogParams = {
  fuelLogId: FuelLogId
  myUserBikeId: MyUserBikeId
  userId: UserId
}

/**
 * 給油ログと、算出済みの燃費（km/L）のペア
 *
 * @remarks
 * 燃費は同一バイクの給油履歴全体（満タン／継ぎ足しの区分）に依存するため、
 * FuelLogEntity単体ではなくサービス層で算出してペアで返す。
 */
export type FuelLogWithEfficiency = {
  fuelLog: FuelLogEntity
  fuelEfficiency: number | null
}

export class FuelLogService {
  private readonly fuelEfficiencyCalculationService =
    new FuelEfficiencyCalculationService()

  constructor(
    private fuelLogRepository: IFuelLogRepository,
    private myUserBikeRepository: IMyUserBikeRepository,
    private userBikeRepository: IUserBikeRepository,
    private touringRepository: ITouringRepository
  ) {}

  /**
   * 指定バイクの給油履歴全体から、燃費（km/L）のMapを算出する
   */
  private async buildFuelEfficiencyMap(
    myUserBikeId: MyUserBikeId
  ): Promise<Map<string, number | null>> {
    const allLogs =
      await this.fuelLogRepository.findAllFuelLogsOrderedByMileage(
        myUserBikeId
      )

    return this.fuelEfficiencyCalculationService.calculate(
      allLogs.map((log) => ({
        fuelLogId: log.id,
        mileage: log.mileage,
        amount: log.amount,
        isFullTank: log.isFullTank,
      }))
    )
  }

  public async registerFuelLog(
    params: RegisterFuelLogParams
  ): Promise<FuelLogWithEfficiency> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.user.id
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const limits = params.user.limits
    if (limits.fuelLog !== null) {
      const count = await this.fuelLogRepository.countFuelLogs(
        params.myUserBikeId
      )
      if (limits.isOver('fuelLog', count)) {
        throw new ApiV1Error('INVALID_REQUEST', limits.limitMessage('fuelLog'))
      }
    }

    let touringId: TouringId | null = null
    let touringTitle: string | null = null

    if (params.touringId) {
      try {
        const touring = await this.touringRepository.findTouringById(
          params.touringId as TouringId,
          params.myUserBikeId
        )
        if (touring) {
          touringId = touring.id
          touringTitle = touring.title
        }
      } catch (error) {
        console.error('Failed to link touring:', error)
      }
    } else {
      const ongoingTouring = await this.touringRepository.findOngoingTouring(
        params.myUserBikeId
      )
      if (ongoingTouring && params.refueledAt >= ongoingTouring.startDate) {
        touringId = ongoingTouring.id
        touringTitle = ongoingTouring.title
      }
    }

    const fuelLog = new FuelLogEntity({
      fuelLogId: createFuelLogId(''),
      myUserBikeId: params.myUserBikeId,
      refueledAt: params.refueledAt,
      mileage: params.mileage,
      previousMileage: params.previousMileage,
      amount: params.amount,
      totalPrice: params.totalPrice,
      isFullTank: params.isFullTank,
      memo: params.memo ?? null,
      touringId,
      touringTitle,
    })

    const createdFuelLog = await this.fuelLogRepository.createFuelLog(fuelLog)

    if (params.updateTotalMileage) {
      await this.userBikeRepository.updateTotalMileageIfGreater(
        myUserBike.userBikeId,
        params.mileage
      )
    }

    const efficiencyMap = await this.buildFuelEfficiencyMap(
      params.myUserBikeId
    )

    return {
      fuelLog: createdFuelLog,
      fuelEfficiency: efficiencyMap.get(createdFuelLog.id) ?? null,
    }
  }

  public async getFuelLogs(
    myUserBikeId: MyUserBikeId,
    userId: UserId,
    searchParams: FuelLogSearchParams
  ): Promise<FuelLogWithEfficiency[]> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const [fuelLogs, efficiencyMap] = await Promise.all([
      this.fuelLogRepository.findFuelLogs(myUserBikeId, searchParams),
      this.buildFuelEfficiencyMap(myUserBikeId),
    ])

    return fuelLogs.map((fuelLog) => ({
      fuelLog,
      fuelEfficiency: efficiencyMap.get(fuelLog.id) ?? null,
    }))
  }

  public async getFuelLogDetail(
    fuelLogId: FuelLogId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<FuelLogWithEfficiency> {
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

    const efficiencyMap = await this.buildFuelEfficiencyMap(myUserBikeId)

    return {
      fuelLog,
      fuelEfficiency: efficiencyMap.get(fuelLog.id) ?? null,
    }
  }

  public async updateFuelLog(
    params: UpdateFuelLogParams
  ): Promise<FuelLogWithEfficiency> {
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
        isFullTank: params.isFullTank ?? existingFuelLog.isFullTank,
        memo: params.memo ?? existingFuelLog.memo,
        touringId: existingFuelLog.touringId,
        touringTitle: existingFuelLog.touringTitle,
      })

      // 4. 更新実行
      const result = await this.fuelLogRepository.updateFuelLog(
        updatedFuelLog
      )

      const efficiencyMap = await this.buildFuelEfficiencyMap(
        params.myUserBikeId
      )

      return {
        fuelLog: result,
        fuelEfficiency: efficiencyMap.get(result.id) ?? null,
      }
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
