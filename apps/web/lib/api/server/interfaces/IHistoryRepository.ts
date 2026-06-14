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

export type PublicHistoryDetail = {
  id: string
  userMyBikeId: string | null
  type: BikeHistoryType
  occurredAt: Date
  userMyBike: {
    nickname: string | null
    userBike: { bike: { modelName: string | null } | null }
  } | null
  fuelLog: {
    id: string
    refueledAt: Date
    mileage: number
    previousMileage: number
    amount: number
    price: number
    memo: string | null
    touringId: string | null
  } | null
  touring: {
    id: string
    planId: string | null
    title: string
    startDate: Date
    endDate: Date
    startMileage: number | null
    endMileage: number | null
    status: 'STARTED' | 'COMPLETED'
  } | null
}

export interface IHistoryRepository {
  createHistory(params: CreateHistoryParams): Promise<HistoryEntity>
  findHistoriesByMyBikeId(myUserBikeId: MyUserBikeId): Promise<HistoryEntity[]>
  findPublicHistoriesByUserId(
    userId: UserId,
    limit: number
  ): Promise<PublicHistoryDetail[]>
  updateOccurredAtByFuelLogId(
    fuelLogId: FuelLogId,
    occurredAt: Date
  ): Promise<void>
  updateOccurredAtByTouringId(
    touringId: TouringId,
    occurredAt: Date
  ): Promise<void>
}
