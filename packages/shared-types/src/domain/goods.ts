import { MyUserBikeId } from './bike'
import { CompanyId } from './company'
import { UserId } from './user'

export type GoodsCategory =
  | 'HELMET'
  | 'GLOVE'
  | 'JACKET'
  | 'PANTS'
  | 'BOOTS'
  | 'RAINWEAR'
  | 'INTERCOM'
  | 'DRIVE_RECORDER'
  | 'NAVIGATION'
  | 'ELECTRICAL'
  | 'BOX_CASE'
  | 'BAG'
  | 'CHAIN_LOCK'
  | 'COVER'
  | 'TOOL'
  | 'OTHER'

export type GoodsModelId = string & { readonly __brand: unique symbol }
export const createGoodsModelId = (id: string): GoodsModelId =>
  id as GoodsModelId

export type GoodsModel = {
  id: GoodsModelId
  goodsManufacturerId: CompanyId
  manufacturerName: string
  modelNumber: string
  name: string
  category: GoodsCategory
  amazonAsin: string | null
  rakutenItemId: string | null
  officialUrl: string | null
}

export type UserGoodsId = string & { readonly __brand: unique symbol }
export const createUserGoodsId = (id: string): UserGoodsId => id as UserGoodsId

/**
 * ユーザーの購入グッズ。マスタ(MGoodsModel)側の表示用情報をJOINして保持する。
 */
export type UserGoods = {
  userGoodsId: UserGoodsId
  userId: UserId
  userMyBikeId: MyUserBikeId | null
  goodsModelId: GoodsModelId
  purchasedAt: Date | null
  price: number | null
  memo: string | null

  // マスタ側の表示用情報（JOIN）
  goodsManufacturerId: CompanyId
  manufacturerName: string
  modelNumber: string
  modelName: string
  category: GoodsCategory
  amazonAsin: string | null
  rakutenItemId: string | null
  officialUrl: string | null

  createdAt: Date
  updatedAt: Date
}
