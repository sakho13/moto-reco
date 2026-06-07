import { TouringId } from './touring'

export type SpotId = string & { readonly __brand: unique symbol }
export const createSpotId = (id: string): SpotId => id as SpotId

export type SpotType = 'SPOT' | 'BREAK'

export type Spot = {
  spotId: SpotId
  touringId: TouringId
  type: SpotType
  name: string | null
  memo: string | null
  latitude: number | null
  longitude: number | null
  visitedAt: Date | null
  endAt: Date | null
  sortOrder: number
  plannedAt: Date | null
  plannedDepartAt: Date | null
  isSkipped: boolean
}
