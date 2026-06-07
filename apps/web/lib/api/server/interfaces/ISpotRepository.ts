import { SpotId, TouringId } from '@repo/shared-types'
import { SpotEntity } from '../entities/SpotEntity'

export interface ISpotRepository {
  createSpot(spot: SpotEntity): Promise<SpotEntity>
  findSpotsByTouringId(touringId: TouringId): Promise<SpotEntity[]>
  findSpotById(spotId: SpotId, touringId: TouringId): Promise<SpotEntity | null>
  updateSpot(spot: SpotEntity): Promise<SpotEntity>
  deleteSpot(spotId: SpotId, touringId: TouringId): Promise<void>
  reorderSpots(spotIds: SpotId[], touringId: TouringId): Promise<void>
  shiftSortOrdersFrom(
    touringId: TouringId,
    fromSortOrder: number
  ): Promise<void>
}
