import {
  CompanyId,
  GoodsCategory,
  GoodsModelId,
  MyUserBikeId,
  UserGoods,
  UserGoodsId,
  UserId,
} from '@repo/shared-types'
import { buildAmazonUrl, buildRakutenUrl } from '../utils/goodsPurchaseLinks'

export class UserGoodsEntity {
  private _value: UserGoods

  constructor(userGoods: UserGoods) {
    if (userGoods.price !== null && userGoods.price < 0) {
      throw new Error('価格は0以上である必要があります')
    }

    this._value = userGoods
  }

  public get id(): UserGoodsId {
    return this._value.userGoodsId
  }

  public get userId(): UserId {
    return this._value.userId
  }

  public get userMyBikeId(): MyUserBikeId | null {
    return this._value.userMyBikeId
  }

  public get goodsModelId(): GoodsModelId {
    return this._value.goodsModelId
  }

  public get purchasedAt(): Date | null {
    return this._value.purchasedAt
  }

  public get price(): number | null {
    return this._value.price
  }

  public get memo(): string | null {
    return this._value.memo
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

  public get modelName(): string {
    return this._value.modelName
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

  public get createdAt(): Date {
    return this._value.createdAt
  }

  public get updatedAt(): Date {
    return this._value.updatedAt
  }

  public toJson(): UserGoods {
    return this._value
  }
}
