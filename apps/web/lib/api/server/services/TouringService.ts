import {
  createSpotId,
  createTouringId,
  createTouringPlanId,
  FuelLogId,
  MyUserBikeId,
  TouringId,
  TouringStatus,
  UserId,
} from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'
import { SpotEntity } from '../entities/SpotEntity'
import { TouringEntity } from '../entities/TouringEntity'
import { UserEntity } from '../entities/UserEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IFuelLogRepository } from '../interfaces/IFuelLogRepository'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { ISpotRepository } from '../interfaces/ISpotRepository'
import { ITouringPlanRepository } from '../interfaces/ITouringPlanRepository'
import { ITouringPlanSpotRepository } from '../interfaces/ITouringPlanSpotRepository'
import { ITouringRepository } from '../interfaces/ITouringRepository'
import { TouringSearchParams } from '../valueObjects/TouringSearchParams'
import { computeTouringPlanSpotTimes } from './computeTouringPlanSpotTimes'

type RegisterTouringParams = {
  myUserBikeId: MyUserBikeId
  user: UserEntity
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
  user: UserEntity
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
  user: UserEntity
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
    private fuelLogRepository: IFuelLogRepository,
    private touringPlanRepository?: ITouringPlanRepository,
    private touringPlanSpotRepository?: ITouringPlanSpotRepository,
    private spotRepository?: ISpotRepository
  ) {}

  public async registerTouring(
    params: RegisterTouringParams
  ): Promise<TouringEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.user.id
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const limits = params.user.limits
    if (limits.touring !== null) {
      const count = await this.touringRepository.countTourings(
        params.myUserBikeId
      )
      if (limits.isOver('touring', count)) {
        throw new ApiV1Error('INVALID_REQUEST', limits.limitMessage('touring'))
      }
    }

    const status = params.status ?? 'COMPLETED'

    // STARTEDで登録する場合は、既に進行中のツーリングがないかチェック
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
        touringPlanId: null,
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
      params.user.id
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    try {
      if (params.action === 'start') {
        const limits = params.user.limits
        if (limits.touring !== null) {
          const count = await this.touringRepository.countTourings(
            params.myUserBikeId
          )
          if (limits.isOver('touring', count)) {
            throw new ApiV1Error(
              'INVALID_REQUEST',
              limits.limitMessage('touring')
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
              params.user.id
            )
          startMileage = totalMileage ?? undefined
        }

        const startDate = params.startDate ?? getCurrentDate()

        // プランから開始する場合: プラン＋プランスポットを取得してコピーする
        if (params.touringPlanId !== undefined) {
          if (
            !this.touringPlanRepository ||
            !this.touringPlanSpotRepository ||
            !this.spotRepository
          ) {
            throw new ApiV1Error(
              'INVALID_REQUEST',
              'プランからのツーリング開始はサポートされていません'
            )
          }

          const touringPlanId = createTouringPlanId(params.touringPlanId)
          const plan = await this.touringPlanRepository.findPlanById(
            touringPlanId,
            params.myUserBikeId
          )
          if (!plan) {
            throw new ApiV1Error(
              'NOT_FOUND',
              '指定されたツーリングプランが見つかりません'
            )
          }

          const planSpotsWithTimes = await computeTouringPlanSpotTimes(
            this.touringPlanSpotRepository,
            plan.id
          )
          const startSpot = planSpotsWithTimes.find(
            (s) => s.spot.type === 'START'
          )?.spot
          const destinationSpot = planSpotsWithTimes.find(
            (s) => s.spot.type === 'DESTINATION'
          )?.spot
          const waypointSpots = planSpotsWithTimes.filter(
            (s) => s.spot.type === 'SPOT' || s.spot.type === 'BREAK'
          )

          const touring = new TouringEntity({
            touringId: createTouringId(''),
            myUserBikeId: params.myUserBikeId,
            touringPlanId: plan.id,
            // プランタイトルを引き継ぐ（不整合 #9 の修正）
            title: params.title ?? plan.title,
            startDate,
            endDate: startDate,
            startMileage: startMileage ?? null,
            endMileage: null,
            startLatitude: params.startLatitude ?? startSpot?.latitude ?? null,
            startLongitude:
              params.startLongitude ?? startSpot?.longitude ?? null,
            endLatitude: destinationSpot?.latitude ?? null,
            endLongitude: destinationSpot?.longitude ?? null,
            status: 'STARTED',
          })

          const created = await this.touringRepository.createTouring(touring)

          // プランスポットの予定時刻（出発からの経過分数）を
          // 実際のツーリング開始時刻(startDate)を基準とした実時刻に再アンカーする
          const reanchorPlannedTime = (
            offsetMinutes: number | null
          ): Date | null => {
            if (offsetMinutes === null) return null
            return new Date(startDate.getTime() + offsetMinutes * 60 * 1000)
          }

          // プランの経由地・休憩を実績スポットとしてコピーする
          for (const [index, waypoint] of waypointSpots.entries()) {
            const spot = new SpotEntity({
              spotId: createSpotId(''),
              touringId: created.id,
              type: waypoint.spot.type === 'BREAK' ? 'BREAK' : 'SPOT',
              name: waypoint.spot.name,
              memo: waypoint.spot.memo,
              latitude: waypoint.spot.latitude,
              longitude: waypoint.spot.longitude,
              plannedArrivalAt: reanchorPlannedTime(
                waypoint.plannedArrivalOffsetMinutes
              ),
              plannedDepartureAt: reanchorPlannedTime(
                waypoint.plannedDepartureOffsetMinutes
              ),
              arrivedAt: null,
              departedAt: null,
              isSkipped: false,
              skippedAt: null,
              sortOrder: index,
            })
            await this.spotRepository.createSpot(spot)
          }

          // プラン自体は変更しない（再利用可能なまま残す）
          return created
        }

        const title = params.title ?? 'ツーリング'
        const touring = new TouringEntity({
          touringId: createTouringId(''),
          myUserBikeId: params.myUserBikeId,
          touringPlanId: null,
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
            params.user.id
          )
        endMileage = totalMileage ?? undefined
      }

      const endDate = params.endDate ?? getCurrentDate()
      const touring = new TouringEntity({
        touringId: existingTouring.id,
        myUserBikeId: existingTouring.myUserBikeId,
        touringPlanId: existingTouring.touringPlanId,
        title: existingTouring.title,
        startDate: existingTouring.startDate,
        endDate,
        startMileage: existingTouring.startMileage,
        endMileage: endMileage ?? existingTouring.endMileage,
        startLatitude: existingTouring.startLatitude,
        startLongitude: existingTouring.startLongitude,
        // Bug #2修正: 未指定時は既存値（プラン由来の終着地など）を保持する
        endLatitude:
          params.endLatitude !== undefined
            ? params.endLatitude
            : existingTouring.endLatitude,
        endLongitude:
          params.endLongitude !== undefined
            ? params.endLongitude
            : existingTouring.endLongitude,
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

    // ステータスをSTARTEDに変更する場合、既に進行中のツーリングがないかチェック
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
        touringPlanId: existingTouring.touringPlanId,
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
        // 既存の紐づけを解除（給油日時がツーリング期間外でも解除対象に含めるため、
        // 期間で絞り込まずtouringIdで直接紐づいている給油履歴を全件取得する）
        const existingFuelLogs =
          await this.fuelLogRepository.findFuelLogsByTouringId(
            params.touringId,
            params.myUserBikeId
          )

        const existingFuelLogIdsToUnlink = existingFuelLogs
          .filter((log) => !params.fuelLogIds!.includes(log.id))
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
