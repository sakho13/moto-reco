import { Spot, SpotId, TouringId } from '@repo/shared-types'

export class SpotEntity {
  private _value: Spot

  constructor(spot: Spot) {
    if (spot.latitude !== null && (spot.latitude < -90 || spot.latitude > 90)) {
      throw new Error('緯度は-90以上90以下である必要があります')
    }

    if (
      spot.longitude !== null &&
      (spot.longitude < -180 || spot.longitude > 180)
    ) {
      throw new Error('経度は-180以上180以下である必要があります')
    }

    this._value = spot
  }

  public get id(): SpotId {
    return this._value.spotId
  }

  public get touringId(): TouringId {
    return this._value.touringId
  }

  public get name(): string | null {
    return this._value.name
  }

  public get memo(): string | null {
    return this._value.memo
  }

  public get latitude(): number | null {
    return this._value.latitude
  }

  public get longitude(): number | null {
    return this._value.longitude
  }

  public get visitedAt(): Date {
    return this._value.visitedAt
  }

  public toJson(): Spot {
    return this._value
  }
}
