import { GoodsManufacturer, GoodsManufacturerId } from '@repo/shared-types'

export class GoodsManufacturerEntity {
  private _value: GoodsManufacturer

  constructor(goodsManufacturer: GoodsManufacturer) {
    this._value = goodsManufacturer
  }

  public get id(): GoodsManufacturerId {
    return this._value.id
  }

  public get name(): string {
    return this._value.name
  }

  public get nameEn(): string | null {
    return this._value.nameEn
  }

  public toJson(): GoodsManufacturer {
    return this._value
  }
}
