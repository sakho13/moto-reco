import { CompanyId } from './company'

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
}
