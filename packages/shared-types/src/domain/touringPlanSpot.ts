import { TouringPlanId } from './touringPlan'

export type TouringPlanSpotId = string & { readonly __brand: unique symbol }
export const createTouringPlanSpotId = (id: string): TouringPlanSpotId =>
  id as TouringPlanSpotId

export type TouringPlanSpotType = 'START' | 'SPOT' | 'BREAK' | 'DESTINATION'

export type TouringPlanRouteType = 'GENERAL' | 'HIGHWAY' | 'MIXED'

export type TouringPlanSpot = {
  touringPlanSpotId: TouringPlanSpotId
  touringPlanId: TouringPlanId
  type: TouringPlanSpotType
  name: string | null
  memo: string | null
  latitude: number | null
  longitude: number | null
  plannedArrivalOffsetMinutes: number | null
  plannedDepartureOffsetMinutes: number | null
  stayMinutes: number | null
  travelMinutesFromPrev: number | null
  routeTypeFromPrev: TouringPlanRouteType | null
  sortOrder: number
}
