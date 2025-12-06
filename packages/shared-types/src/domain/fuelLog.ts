import { MyUserBikeId } from './bike.js'

export type FuelLogId = string & { readonly __brand: unique symbol }
export const createFuelLogId = (id: string): FuelLogId => id as FuelLogId

export type FuelLog = {
  fuelLogId: FuelLogId
  myUserBikeId: MyUserBikeId
  refueledAt: Date
  mileage: number // 給油時走行距離 (km)
  amount: number // 給油量 (L)
  totalPrice: number // 合計価格 (円)
}
