import {
  BikeId,
  MyUserBike,
  MyUserBikeId,
  UserBikeId,
  UserMyBikeOwnStatus,
} from '@shared-types/index'

export class UserMyBikeEntity {
  private _value: MyUserBike

  constructor(myUserBike: MyUserBike) {
    this._value = myUserBike
  }

  public get myUserBikeId(): MyUserBikeId {
    return this._value.myUserBikeId
  }

  public get userBikeId(): UserBikeId {
    return this._value.userBikeId
  }

  public get bikeId(): BikeId {
    return this._value.bikeId
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

  public get ownStatus(): UserMyBikeOwnStatus {
    return this._value.ownStatus
  }

  public toJson(): MyUserBike {
    return this._value
  }
}
