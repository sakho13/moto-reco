import { MyUserBikeId } from './bike'
import { TouringPlanId } from './touringPlan'

export type TouringId = string & { readonly __brand: unique symbol }
export const createTouringId = (id: string): TouringId => id as TouringId

export type TouringStatus = 'STARTED' | 'COMPLETED'

export type Touring = {
  touringId: TouringId
  myUserBikeId: MyUserBikeId
  touringPlanId: TouringPlanId | null
  title: string
  startDate: Date
  endDate: Date
  startMileage: number | null
  endMileage: number | null
  startLatitude: number | null
  startLongitude: number | null
  endLatitude: number | null
  endLongitude: number | null
  status: TouringStatus
}
