import {
  createTouringId,
  FuelLogId,
  MyUserBikeId,
  TouringId,
  TouringStatus,
  UserId,
} from '@repo/shared-types'
import { GUEST_ACCOUNT_LIMITS } from '../../../statics'
import { TouringEntity } from '../entities/TouringEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IFuelLogRepository } from '../interfaces/IFuelLogRepository'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { ITouringRepository } from '../interfaces/ITouringRepository'
import { FuelLogSearchParams } from '../valueObjects/FuelLogSearchParams'
import { TouringSearchParams } from '../valueObjects/TouringSearchParams'

type RegisterTouringParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  role: 'USER' | 'ADMIN' | 'GUEST'
  title: string
  startDate: Date
  endDate: Date
  startMileage?: number
  endMileage?: number
  status?: TouringStatus
}

type StartTouringParams = {
  action: 'start'
  myUserBikeId: MyUserBikeId
  userId: UserId
  role: 'USER' | 'ADMIN' | 'GUEST'
  touringPlanId?: string
  title?: string
  startDate?: Date
  startMileage?: number
  startLatitude?: number
  startLongitude?: number
}

type EndTouringParams = {
  action: 'end'
  myUserBikeId: MyUserBikeId
  userId: UserId
  touringId: string
  endDate?: Date
  endMileage?: number
  endLatitude?: number
  endLongitude?: number
}

type TouringActionParams = StartTouringParams | EndTouringParams

type UpdateTouringParams = {
  touringId: TouringId
  myUserBikeId: MyUserBikeId
  userId: UserId
  title?: string
  startDate?: Date
  endDate?: Date
  startMileage?: number
  endMileage?: number
  status?: TouringStatus
  fuelLogIds?: FuelLogId[]
  startLatitude?: number | null
  startLongitude?: number | null
  endLatitude?: number | null
  endLongitude?: number | null
}

export class TouringService {
  constructor(
    private touringRepository: ITouringRepository,
    private myUserBikeRepository: IMyUserBikeRepository,
    private fuelLogRepository: IFuelLogRepository
  ) {}

  public async registerTouring(
    params: RegisterTouringParams
  ): Promise<TouringEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    // ゲストアカウントのプランモード制限
    if (params.role === 'GUEST' && params.status === 'PLANNED') {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'ゲストアカウントはツーリングプランを使用できません'
      )
    }

    // ゲストアカウントのツーリング登録数チェック
    if (params.role === 'GUEST') {
      const count = await this.touringRepository.countTourings(
        params.myUserBikeId
      )
      if (count >= GUEST_ACCOUNT_LIMITS.TOURING) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          'ゲストアカウントはツーリング履歴を2件まで登録できます'
        )
      }
    }

    const status = params.status ?? 'COMPLETED'

    // STARTEDで登録する場合は、既に進行中のツーリングがないかチェック（PLANNEDは複数登録可能）
    if (status === 'STARTED') {
      const ongoingTouring = await this.touringRepository.findOngoingTouring(
        params.myUserBikeId
      )
      if (ongoingTouring) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          '既に進行中のツーリングが存在します'
        )
      }
    }

    try {
      const touring = new TouringEntity({
        touringId: createTouringId(''),
        myUserBikeId: params.myUserBikeId,
        title: params.title,
        startDate: params.startDate,
        endDate: params.endDate,
        startMileage: params.startMileage ?? null,
        endMileage: params.endMileage ?? null,
        startLatitude: null,
        startLongitude: null,
        endLatitude: null,
        endLongitude: null,
        status,
      })

      return await this.touringRepository.createTouring(touring)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  public async handleTouringAction(
    params: TouringActionParams
  ): Promise<TouringEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    try {
      if (params.action === 'start') {
        // ゲストアカウントのツーリング登録数チェック（プランから開始する場合は新規作成ではないためスキップ）
        if (params.role === 'GUEST' && params.touringPlanId === undefined) {
          const count = await this.touringRepository.countTourings(
            params.myUserBikeId
          )
          if (count >= GUEST_ACCOUNT_LIMITS.TOURING) {
            throw new ApiV1Error(
              'INVALID_REQUEST',
              'ゲストアカウントはツーリング履歴を2件まで登録できます'
            )
          }
        }

        // 既に進行中のツーリングがないかチェック
        const ongoingTouring = await this.touringRepository.findOngoingTouring(
          params.myUserBikeId
        )
        if (ongoingTouring) {
          throw new ApiV1Error(
            'INVALID_REQUEST',
            '既に進行中のツーリングが存在します'
          )
        }

        // 開始時走行距離の自動取得
        let startMileage = params.startMileage
        if (startMileage === undefined) {
          const totalMileage =
            await this.myUserBikeRepository.findMyUserBikeTotalMileage(
              params.myUserBikeId,
              params.userId
            )
          startMileage = totalMileage ?? undefined
        }

        const startDate = params.startDate ?? new Date()

        // プランから開始する場合は既存の PLANNED ツーリングを STARTED に更新
        if (params.touringPlanId !== undefined) {
          const plan = await this.touringRepository.findTouringById(
            createTouringId(params.touringPlanId),
            params.myUserBikeId
          )
          if (!plan) {
            throw new ApiV1Error(
              'NOT_FOUND',
              '指定されたツーリングプランが見つかりません'
            )
          }
          if (plan.status !== 'PLANNED') {
            throw new ApiV1Error(
              'INVALID_REQUEST',
              '指定されたツーリングはプラン状態ではありません'
            )
          }

          const updatedPlan = new TouringEntity({
            touringId: plan.id,
            myUserBikeId: plan.myUserBikeId,
            title: params.title ?? plan.title,
            startDate,
            endDate: plan.endDate,
            startMileage: startMileage ?? plan.startMileage,
            endMileage: null,
            startLatitude: params.startLatitude ?? plan.startLatitude,
            startLongitude: params.startLongitude ?? plan.startLongitude,
            endLatitude: plan.endLatitude,
            endLongitude: plan.endLongitude,
            status: 'STARTED',
          })

          return await this.touringRepository.updateTouring(updatedPlan)
        }

        const title = params.title ?? 'ツーリング'
        const touring = new TouringEntity({
          touringId: createTouringId(''),
          myUserBikeId: params.myUserBikeId,
          title,
          startDate,
          endDate: startDate,
          startMileage: startMileage ?? null,
          endMileage: null,
          startLatitude: params.startLatitude ?? null,
          startLongitude: params.startLongitude ?? null,
          endLatitude: null,
          endLongitude: null,
          status: 'STARTED',
        })

        return await this.touringRepository.createTouring(touring)
      }

      const existingTouring = await this.touringRepository.findTouringById(
        createTouringId(params.touringId),
        params.myUserBikeId
      )

      if (!existingTouring) {
        throw new ApiV1Error(
          'NOT_FOUND',
          '指定されたツーリングが見つかりません'
        )
      }

      // 終了時走行距離の自動取得
      let endMileage = params.endMileage
      if (endMileage === undefined) {
        const totalMileage =
          await this.myUserBikeRepository.findMyUserBikeTotalMileage(
            params.myUserBikeId,
            params.userId
          )
        endMileage = totalMileage ?? undefined
      }

      const endDate = params.endDate ?? new Date()
      const touring = new TouringEntity({
        touringId: existingTouring.id,
        myUserBikeId: existingTouring.myUserBikeId,
        title: existingTouring.title,
        startDate: existingTouring.startDate,
        endDate,
        startMileage: existingTouring.startMileage,
        endMileage: endMileage ?? existingTouring.endMileage,
        startLatitude: existingTouring.startLatitude,
        startLongitude: existingTouring.startLongitude,
        endLatitude: params.endLatitude ?? null,
        endLongitude: params.endLongitude ?? null,
        status: 'COMPLETED',
      })

      return await this.touringRepository.updateTouring(touring)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  public async getTourings(
    myUserBikeId: MyUserBikeId,
    userId: UserId,
    searchParams: TouringSearchParams
  ): Promise<TouringEntity[]> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    return await this.touringRepository.findTourings(myUserBikeId, searchParams)
  }

  public async getTouringById(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<TouringEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const touring = await this.touringRepository.findTouringById(
      touringId,
      myUserBikeId
    )

    if (!touring) {
      throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
    }

    return touring
  }

  public async updateTouring(
    params: UpdateTouringParams
  ): Promise<TouringEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const existingTouring = await this.touringRepository.findTouringById(
      params.touringId,
      params.myUserBikeId
    )

    if (!existingTouring) {
      throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
    }

    // ステータスをSTARTEDに変更する場合、既に進行中のツーリングがないかチェック（PLANNEDからの遷移も含む）
    const newStatus = params.status ?? existingTouring.status
    if (newStatus === 'STARTED' && existingTouring.status !== 'STARTED') {
      const ongoingTouring = await this.touringRepository.findOngoingTouring(
        params.myUserBikeId
      )
      if (ongoingTouring && ongoingTouring.id !== params.touringId) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          '既に進行中のツーリングが存在します'
        )
      }
    }

    try {
      const updatedTouring = new TouringEntity({
        touringId: existingTouring.id,
        myUserBikeId: existingTouring.myUserBikeId,
        title: params.title ?? existingTouring.title,
        startDate: params.startDate ?? existingTouring.startDate,
        endDate: params.endDate ?? existingTouring.endDate,
        startMileage: params.startMileage ?? existingTouring.startMileage,
        endMileage: params.endMileage ?? existingTouring.endMileage,
        startLatitude:
          params.startLatitude !== undefined
            ? params.startLatitude
            : existingTouring.startLatitude,
        startLongitude:
          params.startLongitude !== undefined
            ? params.startLongitude
            : existingTouring.startLongitude,
        endLatitude:
          params.endLatitude !== undefined
            ? params.endLatitude
            : existingTouring.endLatitude,
        endLongitude:
          params.endLongitude !== undefined
            ? params.endLongitude
            : existingTouring.endLongitude,
        status: newStatus,
      })

      const result = await this.touringRepository.updateTouring(updatedTouring)

      // 給油履歴の紐づけ更新
      if (params.fuelLogIds !== undefined) {
        // 既存の紐づけを解除
        const searchParams = new FuelLogSearchParams({
          startDate: updatedTouring.startDate,
          endDate: updatedTouring.endDate,
        })
        const existingFuelLogs = await this.fuelLogRepository.findFuelLogs(
          params.myUserBikeId,
          searchParams
        )

        const existingFuelLogIdsToUnlink = existingFuelLogs
          .filter(
            (log) =>
              log.touringId === params.touringId &&
              !params.fuelLogIds!.includes(log.id)
          )
          .map((log) => log.id)

        if (existingFuelLogIdsToUnlink.length > 0) {
          await this.fuelLogRepository.updateMultipleFuelLogsTouringId(
            existingFuelLogIdsToUnlink,
            params.myUserBikeId,
            null
          )
        }

        // 新しい紐づけを設定
        if (params.fuelLogIds.length > 0) {
          await this.fuelLogRepository.updateMultipleFuelLogsTouringId(
            params.fuelLogIds,
            params.myUserBikeId,
            params.touringId
          )
        }
      }

      return result
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  public async deleteTouring(params: {
    touringId: TouringId
    myUserBikeId: MyUserBikeId
    userId: UserId
  }): Promise<void> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )
    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const existingTouring = await this.touringRepository.findTouringById(
      params.touringId,
      params.myUserBikeId
    )
    if (!existingTouring) {
      throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
    }

    await this.touringRepository.deleteTouring(
      params.touringId,
      params.myUserBikeId
    )
  }
}
