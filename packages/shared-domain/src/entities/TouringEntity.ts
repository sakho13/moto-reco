import {
  MyUserBikeId,
  Touring,
  TouringId,
  TouringPlanId,
  TouringStatus,
} from '@repo/shared-types'

export class TouringEntity {
  private _value: Touring

  constructor(touring: Touring) {
    if (touring.title.trim().length === 0) {
      throw new Error('タイトルは1文字以上である必要があります')
    }

    if (touring.startDate > touring.endDate) {
      throw new Error('開始日は終了日以前である必要があります')
    }

    if (touring.startMileage !== null && touring.startMileage < 0) {
      throw new Error('開始時の総走行距離は0以上である必要があります')
    }

    if (touring.endMileage !== null && touring.endMileage < 0) {
      throw new Error('終了時の総走行距離は0以上である必要があります')
    }

    if (
      touring.startMileage !== null &&
      touring.endMileage !== null &&
      touring.startMileage > touring.endMileage
    ) {
      throw new Error(
        '開始時の総走行距離は終了時の総走行距離以下である必要があります'
      )
    }

    if (
      touring.startLatitude !== null &&
      (touring.startLatitude < -90 || touring.startLatitude > 90)
    ) {
      throw new Error('開始地点の緯度は-90以上90以下である必要があります')
    }

    if (
      touring.startLongitude !== null &&
      (touring.startLongitude < -180 || touring.startLongitude > 180)
    ) {
      throw new Error('開始地点の経度は-180以上180以下である必要があります')
    }

    if (
      touring.endLatitude !== null &&
      (touring.endLatitude < -90 || touring.endLatitude > 90)
    ) {
      throw new Error('終了地点の緯度は-90以上90以下である必要があります')
    }

    if (
      touring.endLongitude !== null &&
      (touring.endLongitude < -180 || touring.endLongitude > 180)
    ) {
      throw new Error('終了地点の経度は-180以上180以下である必要があります')
    }

    this._value = touring
  }

  public get id(): TouringId {
    return this._value.touringId
  }

  public get myUserBikeId(): MyUserBikeId {
    return this._value.myUserBikeId
  }

  public get touringPlanId(): TouringPlanId | null {
    return this._value.touringPlanId
  }

  public get title(): string {
    return this._value.title
  }

  public get startDate(): Date {
    return this._value.startDate
  }

  public get endDate(): Date {
    return this._value.endDate
  }

  public get startMileage(): number | null {
    return this._value.startMileage
  }

  public get endMileage(): number | null {
    return this._value.endMileage
  }

  public get startLatitude(): number | null {
    return this._value.startLatitude
  }

  public get startLongitude(): number | null {
    return this._value.startLongitude
  }

  public get endLatitude(): number | null {
    return this._value.endLatitude
  }

  public get endLongitude(): number | null {
    return this._value.endLongitude
  }

  public get status(): TouringStatus {
    return this._value.status
  }

  public toJson(): Touring {
    return this._value
  }
}
