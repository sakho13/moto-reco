import { MyUserBikeId, Touring, TouringId } from '@repo/shared-types'

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

    this._value = touring
  }

  public get id(): TouringId {
    return this._value.touringId
  }

  public get myUserBikeId(): MyUserBikeId {
    return this._value.myUserBikeId
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

  public toJson(): Touring {
    return this._value
  }
}
