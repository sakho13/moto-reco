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
  bikeId: BikeId
  userBikeId: UserBikeId

  serialNumber: string
}

export type MyUserBikeId = string & { readonly __brand: unique symbol }
export const createMyUserBikeId = (id: string): MyUserBikeId =>
  id as MyUserBikeId

export type MyUserBike = {
  bikeId: BikeId
  userBikeId: UserBikeId
  myUserBikeId: MyUserBikeId

  nickname: string | null
  purchaseDate: Date | null
  purchasePrice: number | null
  purchaseMileage: number | null
  totalMileage: number

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
