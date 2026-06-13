import {
  createTouringPlanId,
  createTouringPlanSpotId,
  MyUserBikeId,
  TouringId,
  TouringPlanId,
  TouringPlanRouteType,
  UserId,
} from '@repo/shared-types'
import { TouringEntity } from '../entities/TouringEntity'
import { TouringPlanEntity } from '../entities/TouringPlanEntity'
import { TouringPlanSpotEntity } from '../entities/TouringPlanSpotEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'
import { ITouringPlanRepository } from '../interfaces/ITouringPlanRepository'
import { ITouringPlanSpotRepository } from '../interfaces/ITouringPlanSpotRepository'
import { ITouringRepository } from '../interfaces/ITouringRepository'
import { recomputeTouringPlanSpotTimes } from './recomputeTouringPlanSpotTimes'

type LocationParams = {
  latitude: number
  longitude: number
  name?: string
  memo?: string
}

type RegisterPlanParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  title: string
  departAt: Date
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
  departAt?: Date
}

export type TouringPlanDetail = {
  plan: TouringPlanEntity
  startSpot: TouringPlanSpotEntity | null
  destinationSpot: TouringPlanSpotEntity | null
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
    startSpot: TouringPlanSpotEntity | null
    destinationSpot: TouringPlanSpotEntity | null
  }> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    try {
      const plan = new TouringPlanEntity({
        touringPlanId: createTouringPlanId(''),
        myUserBikeId: params.myUserBikeId,
        title: params.title,
        departAt: params.departAt,
        returnAt: params.departAt, // 後でrecomputeTouringPlanSpotTimesにより再計算される
      })

      const createdPlan = await this.touringPlanRepository.createPlan(plan)

      let startSpot: TouringPlanSpotEntity | null = null
      if (params.startLocation) {
        const spot = new TouringPlanSpotEntity({
          touringPlanSpotId: createTouringPlanSpotId(''),
          touringPlanId: createdPlan.id,
          type: 'START',
          name: params.startLocation.name ?? null,
          memo: params.startLocation.memo ?? null,
          latitude: params.startLocation.latitude,
          longitude: params.startLocation.longitude,
          plannedArrivalAt: null,
          plannedDepartureAt: null,
          stayMinutes: null,
          travelMinutesFromPrev: null,
          routeTypeFromPrev: null,
          sortOrder: 0,
        })
        startSpot = await this.touringPlanSpotRepository.createPlanSpot(spot)
      }

      let destinationSpot: TouringPlanSpotEntity | null = null
      if (params.destinationLocation) {
        const spot = new TouringPlanSpotEntity({
          touringPlanSpotId: createTouringPlanSpotId(''),
          touringPlanId: createdPlan.id,
          type: 'DESTINATION',
          name: params.destinationLocation.name ?? null,
          memo: params.destinationLocation.memo ?? null,
          latitude: params.destinationLocation.latitude,
          longitude: params.destinationLocation.longitude,
          plannedArrivalAt: null,
          plannedDepartureAt: null,
          stayMinutes: null,
          travelMinutesFromPrev:
            params.destinationLocation.travelMinutesFromPrev ?? null,
          routeTypeFromPrev:
            params.destinationLocation.routeTypeFromPrev ?? null,
          sortOrder: 9999,
        })
        destinationSpot =
          await this.touringPlanSpotRepository.createPlanSpot(spot)
      }

      const recomputedPlan = await recomputeTouringPlanSpotTimes(
        this.touringPlanSpotRepository,
        this.touringPlanRepository,
        createdPlan.id,
        createdPlan
      )

      return { plan: recomputedPlan, startSpot, destinationSpot }
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

    const [startSpot, destinationSpot, tourings] = await Promise.all([
      this.touringPlanSpotRepository.findPlanSpotByType(planId, 'START'),
      this.touringPlanSpotRepository.findPlanSpotByType(planId, 'DESTINATION'),
      this.touringRepository.findTouringsByPlanId(planId),
    ])

    return {
      plan,
      startSpot,
      destinationSpot,
      touringIds: tourings.map((t: TouringEntity) => t.id),
    }
  }

  /**
   * プランのタイトル・出発予定日時を更新する
   *
   * @remarks
   * `departAt` 変更時は {@link recomputeTouringPlanSpotTimes} により
   * 各スポットの予定到着・出発時刻と `returnAt` を再計算する。
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
      if (params.departAt !== undefined) {
        // returnAtは一旦departAtで仮置きする
        // （existingPlan.returnAtのままだと departAt > returnAt となり
        //   エンティティのバリデーションに違反する可能性があるため）。
        // 直後のrecomputeTouringPlanSpotTimesで正しい値に再計算される。
        const updatedPlan = new TouringPlanEntity({
          touringPlanId: existingPlan.id,
          myUserBikeId: existingPlan.myUserBikeId,
          title: params.title ?? existingPlan.title,
          departAt: params.departAt,
          returnAt: params.departAt,
        })

        const savedPlan =
          await this.touringPlanRepository.updatePlan(updatedPlan)

        return await recomputeTouringPlanSpotTimes(
          this.touringPlanSpotRepository,
          this.touringPlanRepository,
          params.planId,
          savedPlan
        )
      }

      const updatedPlan = new TouringPlanEntity({
        touringPlanId: existingPlan.id,
        myUserBikeId: existingPlan.myUserBikeId,
        title: params.title ?? existingPlan.title,
        departAt: existingPlan.departAt,
        returnAt: existingPlan.returnAt,
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
