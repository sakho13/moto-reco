import { TouringPlanId } from './touringPlan'

export type TouringPlanSpotId = string & { readonly __brand: unique symbol }
export const createTouringPlanSpotId = (id: string): TouringPlanSpotId =>
  id as TouringPlanSpotId

export type TouringPlanSpotType = 'START' | 'SPOT' | 'BREAK' | 'DESTINATION'

export type TouringPlanSpot = {
  touringPlanSpotId: TouringPlanSpotId
  touringPlanId: TouringPlanId
  type: TouringPlanSpotType
  name: string | null
  memo: string | null
  latitude: number | null
  longitude: number | null
  plannedArrivalAt: Date | null
  plannedDepartureAt: Date | null
  sortOrder: number
}
