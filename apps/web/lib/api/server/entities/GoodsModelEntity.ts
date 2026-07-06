import {
  GoodsCategory,
  GoodsManufacturerId,
  GoodsModel,
  GoodsModelId,
} from '@repo/shared-types'

export class GoodsModelEntity {
  private _value: GoodsModel

  constructor(goodsModel: GoodsModel) {
    this._value = goodsModel
  }

  public get id(): GoodsModelId {
    return this._value.id
  }

  public get goodsManufacturerId(): GoodsManufacturerId {
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

  public toJson(): GoodsModel {
    return this._value
  }
}
