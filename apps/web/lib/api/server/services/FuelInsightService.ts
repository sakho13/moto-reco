import { FuelInsightPeriod, MyUserBikeId, UserId } from '@repo/shared-types'
import { FuelInsightEntity } from '../entities/FuelInsightEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IFuelInsightRepository } from '../interfaces/IFuelInsightRepository'
import { IMyUserBikeRepository } from '../interfaces/IMyUserBikeRepository'

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
