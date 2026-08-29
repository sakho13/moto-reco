import { FuelInsightPeriod, MyUserBikeId } from '@repo/shared-types'
import { FuelInsightEntity } from '../entities/FuelInsightEntity'

export interface IFuelInsightRepository {
  getFuelInsight(
    myUserBikeId: MyUserBikeId,
    period: FuelInsightPeriod
  ): Promise<FuelInsightEntity>
}
