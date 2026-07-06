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

export type GoodsManufacturerId = string & { readonly __brand: unique symbol }
export const createGoodsManufacturerId = (id: string): GoodsManufacturerId =>
  id as GoodsManufacturerId

export type GoodsManufacturer = {
  id: GoodsManufacturerId
  name: string
  nameEn: string | null
}

export type GoodsModelId = string & { readonly __brand: unique symbol }
export const createGoodsModelId = (id: string): GoodsModelId =>
  id as GoodsModelId

export type GoodsModel = {
  id: GoodsModelId
  goodsManufacturerId: GoodsManufacturerId
  manufacturerName: string
  modelNumber: string
  name: string
  category: GoodsCategory
  amazonAsin: string | null
  rakutenItemId: string | null
}
