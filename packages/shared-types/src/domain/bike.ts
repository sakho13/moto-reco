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

export type MyUserBike = UserBike & {
  myUserBikeId: MyUserBikeId
  userId: UserId

  nickname: string | null
  purchaseDate: Date | null
  purchasePrice: number | null
  purchaseMileage: number | null
  /** ETC車載器の搭載状況（null: 未設定） */
  etcType: EtcDeviceType | null

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

/**
 * ETC車載器の搭載状況
 *
 * @remarks
 * 未設定（情報なし）は `null` で表し、`NONE`（未搭載）と区別する。
 * MCP経由でLLMがルートを検討するとき「情報なし」と「未搭載」を取り違えないため。
 */
export const ETC_DEVICE_TYPES = ['NONE', 'ETC', 'ETC2'] as const

export type EtcDeviceType = (typeof ETC_DEVICE_TYPES)[number]

/** ETC車載器の搭載状況の表示ラベル */
export const ETC_DEVICE_TYPE_LABELS: Record<EtcDeviceType, string> = {
  NONE: '未搭載',
  ETC: 'ETC',
  ETC2: 'ETC2.0',
}
