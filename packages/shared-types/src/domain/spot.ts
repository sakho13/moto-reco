import { TouringId } from './touring'

export type SpotId = string & { readonly __brand: unique symbol }
export const createSpotId = (id: string): SpotId => id as SpotId

export type Spot = {
  spotId: SpotId
  touringId: TouringId
  name: string | null
  memo: string | null
  latitude: number | null
  longitude: number | null
  visitedAt: Date
  sortOrder: number
}
