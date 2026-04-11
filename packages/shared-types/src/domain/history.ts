import { MyUserBikeId } from './bike'
import { FuelLogId } from './fuelLog'
import { TouringId } from './touring'
import { UserId } from './user'

export type HistoryId = string & { readonly __brand: unique symbol }
export const createHistoryId = (id: string): HistoryId => id as HistoryId

export type BikeHistoryType = 'FUEL_LOG' | 'TOURING' | 'MAINTENANCE'

export type History = {
  historyId: HistoryId
  userId: UserId
  userMyBikeId: MyUserBikeId | null
  type: BikeHistoryType
  occurredAt: Date
  fuelLogId: FuelLogId | null
  touringId: TouringId | null
}
