import {
  BikeHistoryType,
  FuelLogId,
  MyUserBikeId,
  TouringId,
  UserId,
} from '@repo/shared-types'
import { HistoryEntity } from '../entities/HistoryEntity'

type CreateHistoryParams = {
  userId: UserId
  userMyBikeId?: MyUserBikeId
  type: BikeHistoryType
  occurredAt: Date
  fuelLogId?: FuelLogId
  touringId?: TouringId
}

export interface IHistoryRepository {
  createHistory(params: CreateHistoryParams): Promise<HistoryEntity>
  findHistoriesByMyBikeId(myUserBikeId: MyUserBikeId): Promise<HistoryEntity[]>
}
