import {
  CompanyId,
  GoodsCategory,
  GoodsModel,
  GoodsModelId,
} from '@repo/shared-types'
import { GoodsPurchaseLinksValue } from '../valueObjects/GoodsPurchaseLinksValue'

export class GoodsModelEntity {
  private _value: GoodsModel
  private _purchaseLinks: GoodsPurchaseLinksValue

  constructor(goodsModel: GoodsModel) {
    this._value = goodsModel
    this._purchaseLinks = GoodsPurchaseLinksValue.from(
      goodsModel.amazonAsin,
      goodsModel.rakutenItemId
    )
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
    return this._purchaseLinks.amazonUrl
  }

  public get rakutenUrl(): string | null {
    return this._purchaseLinks.rakutenUrl
  }

  public toJson(): GoodsModel {
    return this._value
  }
}
