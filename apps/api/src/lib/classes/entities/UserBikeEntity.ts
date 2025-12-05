import { BikeId, UserBike, UserBikeId } from '@shared-types/index'

export class UserBikeEntity {
  private _value: UserBike

  constructor(userBike: UserBike) {
    this._value = userBike
  }

  public get userBikeId(): UserBikeId {
    return this._value.userBikeId
  }

  public get bikeId(): BikeId {
    return this._value.bikeId
  }

  public get serialNumber(): string {
    return this._value.serialNumber
  }

  public toJson(): UserBike {
    return this._value
  }
}
