import { MyUserBikeId } from './bike.js'

export type MyUserBikeFuelLogId = string & { readonly __brand: unique symbol }
export const createMyUserBikeFuelLogId = (id: string): MyUserBikeFuelLogId =>
  id as MyUserBikeFuelLogId

export type MyUserBikeFuelLog = {
  fuelLogId: MyUserBikeFuelLogId
  myUserBikeId: MyUserBikeId
  refueledAt: Date
  mileage: number
  amount: number
  totalPrice: number
  createdAt?: Date
  updatedAt?: Date
}
