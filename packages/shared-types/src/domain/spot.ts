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
  // プラン由来の参考予定値（プランから開始した場合にコピーされる。常にこの意味）
  plannedArrivalAt: Date | null
  plannedDepartureAt: Date | null
  // 実績（常にこの意味。statusに関わらず固定）
  arrivedAt: Date | null
  departedAt: Date | null
  isSkipped: boolean
  skippedAt: Date | null
  sortOrder: number
}
