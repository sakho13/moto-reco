import {
  TouringPlanId,
  TouringPlanRouteType,
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
      spot.plannedArrivalOffsetMinutes !== null &&
      spot.plannedDepartureOffsetMinutes !== null &&
      spot.plannedArrivalOffsetMinutes > spot.plannedDepartureOffsetMinutes
    ) {
      throw new Error('到着予定時刻は出発予定時刻以前である必要があります')
    }

    if (spot.stayMinutes !== null && spot.stayMinutes < 0) {
      throw new Error('滞在時間は0以上である必要があります')
    }

    if (spot.travelMinutesFromPrev !== null && spot.travelMinutesFromPrev < 0) {
      throw new Error('前の地点からの移動時間は0以上である必要があります')
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

  public get plannedArrivalOffsetMinutes(): number | null {
    return this._value.plannedArrivalOffsetMinutes
  }

  public get plannedDepartureOffsetMinutes(): number | null {
    return this._value.plannedDepartureOffsetMinutes
  }

  public get stayMinutes(): number | null {
    return this._value.stayMinutes
  }

  public get travelMinutesFromPrev(): number | null {
    return this._value.travelMinutesFromPrev
  }

  public get routeTypeFromPrev(): TouringPlanRouteType | null {
    return this._value.routeTypeFromPrev
  }

  public get sortOrder(): number {
    return this._value.sortOrder
  }

  public toJson(): TouringPlanSpot {
    return this._value
  }
}
