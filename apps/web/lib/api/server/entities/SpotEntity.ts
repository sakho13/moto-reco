import { Spot, SpotId, SpotType, TouringId } from '@repo/shared-types'

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

    if (
      spot.visitedAt !== null &&
      spot.endAt !== null &&
      spot.visitedAt > spot.endAt
    ) {
      throw new Error('開始日時は終了日時以前である必要があります')
    }

    this._value = spot
  }

  public get id(): SpotId {
    return this._value.spotId
  }

  public get touringId(): TouringId {
    return this._value.touringId
  }

  public get type(): SpotType {
    return this._value.type
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

  public get visitedAt(): Date | null {
    return this._value.visitedAt
  }

  public get endAt(): Date | null {
    return this._value.endAt
  }

  public get sortOrder(): number {
    return this._value.sortOrder
  }

  public get plannedAt(): Date | null {
    return this._value.plannedAt
  }

  public get plannedDepartAt(): Date | null {
    return this._value.plannedDepartAt
  }

  public toJson(): Spot {
    return this._value
  }
}
