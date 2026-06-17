import {
  createTouringPlanId,
  createTouringPlanSpotId,
  MyUserBikeId,
  TouringId,
  TouringPlanId,
  TouringPlanRouteType,
  UserId,
} from '@repo/shared-types'
import { FREE_USER_LIMITS, GUEST_ACCOUNT_LIMITS } from '../../../statics'
import { TouringEntity } from '../entities/TouringEntity'
import { TouringPlanEntity } from '../entities/TouringPlanEntity'
import { TouringPlanSpotEntity } from '../entities/TouringPlanSpotEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { ITouringPlanRepository } from '../interfaces/ITouringPlanRepository'
import { ITouringPlanSpotRepository } from '../interfaces/ITouringPlanSpotRepository'
import { ITouringRepository } from '../interfaces/ITouringRepository'
import {
  computeTouringPlanSpotTimes,
  TouringPlanSpotWithTimes,
} from './computeTouringPlanSpotTimes'

type LocationParams = {
  latitude: number
  longitude: number
  name?: string
  memo?: string
}

type RegisterPlanParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  role: 'USER' | 'ADMIN' | 'GUEST'
  title: string
  startLocation?: LocationParams | null
  destinationLocation?:
    | (LocationParams & {
        travelMinutesFromPrev?: number
        routeTypeFromPrev?: TouringPlanRouteType
      })
    | null
}

type UpdatePlanParams = {
  planId: TouringPlanId
  myUserBikeId: MyUserBikeId
  userId: UserId
  title?: string
}

export type TouringPlanDetail = {
  plan: TouringPlanEntity
  startSpot: TouringPlanSpotWithTimes | null
  destinationSpot: TouringPlanSpotWithTimes | null
  touringIds: TouringId[]
}

/**
 * ツーリングプラン（再利用可能なルートテンプレート）に関する
 * ビジネスロジックを実装するサービス
 */
export class TouringPlanService {
  constructor(
    private touringPlanRepository: ITouringPlanRepository,
    private touringPlanSpotRepository: ITouringPlanSpotRepository,
    private touringRepository: ITouringRepository,
    private myUserBikeRepository: IMyUserBikeRepository
  ) {}

  /**
   * ツーリングプランを新規登録する
   *
   * @remarks
   * `startLocation`/`destinationLocation` を指定した場合、プラン作成と
   * 同一トランザクションで `START`/`DESTINATION` スポットも作成する。
   */
  public async registerPlan(params: RegisterPlanParams): Promise<{
    plan: TouringPlanEntity
    startSpot: TouringPlanSpotWithTimes | null
    destinationSpot: TouringPlanSpotWithTimes | null
  }> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    if (params.role === 'GUEST') {
      const count = await this.touringPlanRepository.countPlans(
        params.myUserBikeId
      )
      if (count >= GUEST_ACCOUNT_LIMITS.TOURING_PLAN) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          'ゲストアカウントはツーリングプランを2件まで登録できます'
        )
      }
    }

    if (params.role === 'USER') {
      const count = await this.touringPlanRepository.countPlans(
        params.myUserBikeId
      )
      if (count >= FREE_USER_LIMITS.TOURING_PLAN) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          '無料ユーザーはツーリングプランを10件まで登録できます'
        )
      }
    }

    try {
      const plan = new TouringPlanEntity({
        touringPlanId: createTouringPlanId(''),
        myUserBikeId: params.myUserBikeId,
        title: params.title,
        // createdAt/updatedAtはプレースホルダー。リポジトリ作成後の戻り値で実値に置き換わる
        createdAt: new Date(0),
        updatedAt: new Date(0),
      })

      const createdPlan = await this.touringPlanRepository.createPlan(plan)

      let createdStartSpot: TouringPlanSpotEntity | null = null
      if (params.startLocation) {
        const spot = new TouringPlanSpotEntity({
          touringPlanSpotId: createTouringPlanSpotId(''),
          touringPlanId: createdPlan.id,
          type: 'START',
          name: params.startLocation.name ?? null,
          memo: params.startLocation.memo ?? null,
          latitude: params.startLocation.latitude,
          longitude: params.startLocation.longitude,
          stayMinutes: null,
          travelMinutesFromPrev: null,
          routeTypeFromPrev: null,
          sortOrder: 0,
        })
        createdStartSpot =
          await this.touringPlanSpotRepository.createPlanSpot(spot)
      }

      let createdDestinationSpot: TouringPlanSpotEntity | null = null
      if (params.destinationLocation) {
        const spot = new TouringPlanSpotEntity({
          touringPlanSpotId: createTouringPlanSpotId(''),
          touringPlanId: createdPlan.id,
          type: 'DESTINATION',
          name: params.destinationLocation.name ?? null,
          memo: params.destinationLocation.memo ?? null,
          latitude: params.destinationLocation.latitude,
          longitude: params.destinationLocation.longitude,
          stayMinutes: null,
          travelMinutesFromPrev:
            params.destinationLocation.travelMinutesFromPrev ?? null,
          routeTypeFromPrev:
            params.destinationLocation.routeTypeFromPrev ?? null,
          sortOrder: 9999,
        })
        createdDestinationSpot =
          await this.touringPlanSpotRepository.createPlanSpot(spot)
      }

      const spotsWithTimes = await computeTouringPlanSpotTimes(
        this.touringPlanSpotRepository,
        createdPlan.id
      )

      const startSpot = createdStartSpot
        ? (spotsWithTimes.find((s) => s.spot.type === 'START') ?? null)
        : null
      const destinationSpot = createdDestinationSpot
        ? (spotsWithTimes.find((s) => s.spot.type === 'DESTINATION') ?? null)
        : null

      return { plan: createdPlan, startSpot, destinationSpot }
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  /**
   * プラン一覧を取得する
   */
  public async getPlans(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<
    {
      plan: TouringPlanEntity
      destinationSpot: TouringPlanSpotEntity | null
    }[]
  > {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const plans = await this.touringPlanRepository.findPlans(myUserBikeId)

    return await Promise.all(
      plans.map(async (plan) => {
        const destinationSpot =
          await this.touringPlanSpotRepository.findPlanSpotByType(
            plan.id,
            'DESTINATION'
          )
        return { plan, destinationSpot }
      })
    )
  }

  /**
   * プラン詳細を取得する
   *
   * @remarks
   * 出発地・目的地に加え、このプランから開始されたツーリングのID一覧
   * (`touringIds`) も合わせて返す。
   */
  public async getPlanById(
    planId: TouringPlanId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<TouringPlanDetail> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const plan = await this.touringPlanRepository.findPlanById(
      planId,
      myUserBikeId
    )

    if (!plan) {
      throw new ApiV1Error(
        'NOT_FOUND',
        '指定されたツーリングプランが見つかりません'
      )
    }

    const [spotsWithTimes, tourings] = await Promise.all([
      computeTouringPlanSpotTimes(this.touringPlanSpotRepository, planId),
      this.touringRepository.findTouringsByPlanId(planId),
    ])

    const startSpot =
      spotsWithTimes.find((s) => s.spot.type === 'START') ?? null
    const destinationSpot =
      spotsWithTimes.find((s) => s.spot.type === 'DESTINATION') ?? null

    return {
      plan,
      startSpot,
      destinationSpot,
      touringIds: tourings.map((t: TouringEntity) => t.id),
    }
  }

  /**
   * プランのタイトルを更新する
   *
   * @remarks
   * 位置情報の更新は専用エンドポイント
   * (`setStartSpot`/`setDestinationSpot`)経由で行う。
   */
  public async updatePlan(
    params: UpdatePlanParams
  ): Promise<TouringPlanEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const existingPlan = await this.touringPlanRepository.findPlanById(
      params.planId,
      params.myUserBikeId
    )

    if (!existingPlan) {
      throw new ApiV1Error(
        'NOT_FOUND',
        '指定されたツーリングプランが見つかりません'
      )
    }

    try {
      const updatedPlan = new TouringPlanEntity({
        touringPlanId: existingPlan.id,
        myUserBikeId: existingPlan.myUserBikeId,
        title: params.title ?? existingPlan.title,
        createdAt: existingPlan.createdAt,
        updatedAt: existingPlan.updatedAt,
      })

      return await this.touringPlanRepository.updatePlan(updatedPlan)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  /**
   * プランを削除する
   */
  public async deletePlan(
    planId: TouringPlanId,
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<void> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const existingPlan = await this.touringPlanRepository.findPlanById(
      planId,
      myUserBikeId
    )

    if (!existingPlan) {
      throw new ApiV1Error(
        'NOT_FOUND',
        '指定されたツーリングプランが見つかりません'
      )
    }

    await this.touringPlanRepository.deletePlan(planId, myUserBikeId)
  }
}
