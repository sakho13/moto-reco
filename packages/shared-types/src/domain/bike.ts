export type BikeId = string & { readonly __brand: unique symbol }
export const createBikeId = (id: string): BikeId => id as BikeId

export type Bike = {
  id: BikeId
  manufacturerId: string
  manufacturer: string
  modelName: string
  displacement: number
  modelYear: number
}

export type UserBikeId = string & { readonly __brand: unique symbol }
export const createUserBikeId = (id: string): UserBikeId => id as UserBikeId

export type UserBike = {
  bikeId: BikeId | null
  userBikeId: UserBikeId
  displacement: number
  totalMileage: number

  serialNumber: string | null
}

export type MyUserBikeId = string & { readonly __brand: unique symbol }
export const createMyUserBikeId = (id: string): MyUserBikeId =>
  id as MyUserBikeId

import { UserId } from './user'

export type MyUserBike = {
  bikeId: BikeId | null
  userBikeId: UserBikeId
  myUserBikeId: MyUserBikeId
  userId: UserId

  nickname: string | null
  purchaseDate: Date | null
  purchasePrice: number | null
  purchaseMileage: number | null
  isPublic: boolean

  ownedAt: Date
  soldAt: Date | null
  ownStatus: UserMyBikeOwnStatus
}

export type UserMyBikeOwnStatus =
  // 所有中
  | 'OWN'
  // 売却済み
  | 'SOLD'
  // 譲渡済み
  | 'TRANSFERRED'
  // 廃車
  | 'SCRAPPED'
