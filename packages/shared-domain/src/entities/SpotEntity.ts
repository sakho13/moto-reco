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
      spot.arrivedAt !== null &&
      spot.departedAt !== null &&
      spot.arrivedAt > spot.departedAt
    ) {
      throw new Error('到着日時は出発日時以前である必要があります')
    }

    if (
      spot.plannedArrivalAt !== null &&
      spot.plannedDepartureAt !== null &&
      spot.plannedArrivalAt > spot.plannedDepartureAt
    ) {
      throw new Error('到着予定日時は出発予定日時以前である必要があります')
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

  public get plannedArrivalAt(): Date | null {
    return this._value.plannedArrivalAt
  }

  public get plannedDepartureAt(): Date | null {
    return this._value.plannedDepartureAt
  }

  public get arrivedAt(): Date | null {
    return this._value.arrivedAt
  }

  public get departedAt(): Date | null {
    return this._value.departedAt
  }

  public get isSkipped(): boolean {
    return this._value.isSkipped
  }

  public get skippedAt(): Date | null {
    return this._value.skippedAt
  }

  public get sortOrder(): number {
    return this._value.sortOrder
  }

  public toJson(): Spot {
    return this._value
  }
}
