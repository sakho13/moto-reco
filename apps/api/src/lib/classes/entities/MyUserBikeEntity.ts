import {
  BikeId,
  MyUserBike,
  MyUserBikeId,
  UserBikeId,
  UserId,
} from '@shared-types/index'

export class MyUserBikeEntity {
  private _value: MyUserBike

  constructor(myUserBike: MyUserBike) {
    if (myUserBike.totalMileage < 0) {
      throw new Error('総走行距離は0以上である必要があります')
    }

    this._value = myUserBike
  }

  public get id(): MyUserBikeId {
    return this._value.myUserBikeId
  }

  public get bikeId(): BikeId {
    return this._value.bikeId
  }

  public get userBikeId(): UserBikeId {
    return this._value.userBikeId
  }

  public get userId(): UserId {
    return this._value.userId
  }

  public get nickname(): string | null {
    return this._value.nickname
  }

  public get purchaseDate(): Date | null {
    return this._value.purchaseDate
  }

  public get purchasePrice(): number | null {
    return this._value.purchasePrice
  }

  public get purchaseMileage(): number | null {
    return this._value.purchaseMileage
  }

  public get totalMileage(): number {
    return this._value.totalMileage
  }

  public get ownedAt(): Date {
    return this._value.ownedAt
  }

  public get soldAt(): Date | null {
    return this._value.soldAt
  }

  public get ownStatus(): MyUserBike['ownStatus'] {
    return this._value.ownStatus
  }

  public toJson(): MyUserBike {
    return this._value
  }
}
