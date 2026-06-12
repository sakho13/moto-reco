import {
  TouringPlanId,
  TouringPlanSpot,
  TouringPlanSpotId,
  TouringPlanSpotType,
} from '@repo/shared-types'

/**
 * ツーリングプランのロケーション（出発地・経由地・休憩・目的地）を表すエンティティ
 */
export class TouringPlanSpotEntity {
  private _value: TouringPlanSpot

  constructor(spot: TouringPlanSpot) {
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
      spot.plannedArrivalAt !== null &&
      spot.plannedDepartureAt !== null &&
      spot.plannedArrivalAt > spot.plannedDepartureAt
    ) {
      throw new Error('到着予定日時は出発予定日時以前である必要があります')
    }

    this._value = spot
  }

  public get id(): TouringPlanSpotId {
    return this._value.touringPlanSpotId
  }

  public get touringPlanId(): TouringPlanId {
    return this._value.touringPlanId
  }

  public get type(): TouringPlanSpotType {
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

  public get sortOrder(): number {
    return this._value.sortOrder
  }

  public toJson(): TouringPlanSpot {
    return this._value
  }
}
