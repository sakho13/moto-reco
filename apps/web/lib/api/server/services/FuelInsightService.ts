import {
  FuelInsightEntity,
  ApiV1Error,
  IFuelInsightRepository,
  IMyUserBikeRepository,
} from '@repo/shared-domain'
import { FuelInsightPeriod, MyUserBikeId, UserId } from '@repo/shared-types'

export class FuelInsightService {
  constructor(
    private fuelInsightRepository: IFuelInsightRepository,
    private myUserBikeRepository: IMyUserBikeRepository
  ) {}

  public async getFuelInsight(
    myUserBikeId: MyUserBikeId,
    userId: UserId,
    period: FuelInsightPeriod
  ): Promise<FuelInsightEntity> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    return await this.fuelInsightRepository.getFuelInsight(myUserBikeId, period)
  }
}
