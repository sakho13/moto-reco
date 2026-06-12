import { MyUserBikeId } from './bike'

export type TouringPlanId = string & { readonly __brand: unique symbol }
export const createTouringPlanId = (id: string): TouringPlanId =>
  id as TouringPlanId

export type TouringPlan = {
  touringPlanId: TouringPlanId
  myUserBikeId: MyUserBikeId
  title: string
  departAt: Date
  returnAt: Date
}
