import {
  MyUserBike,
  MyUserBikeId,
  UserBike,
  UserBikeId,
  UserId,
} from '@repo/shared-types'
import { UserBikeEntity } from './UserBikeEntity'

export class MyUserBikeEntity extends UserBikeEntity {
  private _myValue: MyUserBike

  constructor(myUserBike: MyUserBike) {
    const userBike: UserBike = {
      bikeId: myUserBike.bikeId,
      userBikeId: myUserBike.userBikeId,
      displacement: myUserBike.displacement,
      totalMileage: myUserBike.totalMileage,
      serialNumber: myUserBike.serialNumber,
    }
    super(userBike) // displacement > 0, totalMileage >= 0 を検証

    if (myUserBike.purchaseMileage !== null && myUserBike.purchaseMileage < 0) {
      throw new Error('購入時走行距離は0以上である必要があります')
    }

    if (myUserBike.purchasePrice !== null && myUserBike.purchasePrice < 0) {
      throw new Error('購入価格は0以上である必要があります')
    }

    // _value は super() で正規化済み（serialNumber.trim, bikeId ?? null）
    this._myValue = {
      ...this._value,
      myUserBikeId: myUserBike.myUserBikeId,
      userId: myUserBike.userId,
      nickname: myUserBike.nickname,
      purchaseDate: myUserBike.purchaseDate,
      purchasePrice: myUserBike.purchasePrice,
      purchaseMileage: myUserBike.purchaseMileage,
      ownedAt: myUserBike.ownedAt,
      soldAt: myUserBike.soldAt,
      ownStatus: myUserBike.ownStatus,
    }
  }

  // bikeId は UserBikeEntity から継承
  // id (UserBikeId) は UserBikeEntity から継承

  public get myUserBikeId(): MyUserBikeId {
    return this._myValue.myUserBikeId
  }

  public get userBikeId(): UserBikeId {
    return this._value.userBikeId
  }

  public get userId(): UserId {
    return this._myValue.userId
  }

  public get nickname(): string | null {
    return this._myValue.nickname
  }

  public get purchaseDate(): Date | null {
    return this._myValue.purchaseDate
  }

  public get purchasePrice(): number | null {
    return this._myValue.purchasePrice
  }

  public get purchaseMileage(): number | null {
    return this._myValue.purchaseMileage
  }

  public get ownedAt(): Date {
    return this._myValue.ownedAt
  }

  public get soldAt(): Date | null {
    return this._myValue.soldAt
  }

  public get ownStatus(): MyUserBike['ownStatus'] {
    return this._myValue.ownStatus
  }

  public override toJson(): MyUserBike {
    return this._myValue
  }
}
