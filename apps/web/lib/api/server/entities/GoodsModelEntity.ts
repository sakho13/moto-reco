import {
  CompanyId,
  GoodsCategory,
  GoodsModel,
  GoodsModelId,
} from '@repo/shared-types'
import { buildAmazonUrl, buildRakutenUrl } from '../utils/goodsPurchaseLinks'

export class GoodsModelEntity {
  private _value: GoodsModel

  constructor(goodsModel: GoodsModel) {
    this._value = goodsModel
  }

  public get id(): GoodsModelId {
    return this._value.id
  }

  public get goodsManufacturerId(): CompanyId {
    return this._value.goodsManufacturerId
  }

  public get manufacturerName(): string {
    return this._value.manufacturerName
  }

  public get modelNumber(): string {
    return this._value.modelNumber
  }

  public get name(): string {
    return this._value.name
  }

  public get category(): GoodsCategory {
    return this._value.category
  }

  public get amazonAsin(): string | null {
    return this._value.amazonAsin
  }

  public get rakutenItemId(): string | null {
    return this._value.rakutenItemId
  }

  public get officialUrl(): string | null {
    return this._value.officialUrl
  }

  public get amazonUrl(): string | null {
    return this._value.amazonAsin
      ? buildAmazonUrl(this._value.amazonAsin)
      : null
  }

  public get rakutenUrl(): string | null {
    return this._value.rakutenItemId
      ? buildRakutenUrl(this._value.rakutenItemId)
      : null
  }

  public toJson(): GoodsModel {
    return this._value
  }
}
