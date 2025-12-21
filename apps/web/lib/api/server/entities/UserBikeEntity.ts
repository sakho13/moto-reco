import { BikeId, UserBike, UserBikeId } from '@packages/shared-types'

export class UserBikeEntity {
  private _value: UserBike

  constructor(userBike: UserBike) {
    if (userBike.displacement <= 0) {
      throw new Error('排気量は0より大きい必要があります')
    }

    this._value = {
      ...userBike,
      bikeId: userBike.bikeId ?? null,
      displacement: userBike.displacement,
      serialNumber: userBike.serialNumber?.trim() ?? null,
    }
  }

  public get id(): UserBikeId {
    return this._value.userBikeId
  }

  public get bikeId(): BikeId | null {
    return this._value.bikeId
  }

  public get displacement(): number {
    return this._value.displacement
  }

  public get serialNumber(): string | null {
    return this._value.serialNumber
  }

  public toJson(): UserBike {
    return this._value
  }
}
