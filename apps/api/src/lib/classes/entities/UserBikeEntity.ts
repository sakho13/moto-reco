import { BikeId, UserBike, UserBikeId } from '@shared-types/index'

export class UserBikeEntity {
  private _value: UserBike

  constructor(userBike: UserBike) {
    this._value = {
      ...userBike,
      serialNumber: userBike.serialNumber?.trim() ?? null,
    }
  }

  public get id(): UserBikeId {
    return this._value.userBikeId
  }

  public get bikeId(): BikeId {
    return this._value.bikeId
  }

  public get serialNumber(): string | null {
    return this._value.serialNumber
  }

  public toJson(): UserBike {
    return this._value
  }
}
