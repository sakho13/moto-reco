import { FuelLog, FuelLogId, MyUserBikeId } from '@repo/shared-types'

export class FuelLogEntity {
  private _value: FuelLog

  constructor(fuelLog: FuelLog) {
    if (fuelLog.amount <= 0) {
      throw new Error('給油量は0より大きい値である必要があります')
    }

    if (fuelLog.totalPrice < 0) {
      throw new Error('合計価格は0以上である必要があります')
    }

    if (fuelLog.mileage < 0) {
      throw new Error('走行距離は0以上である必要があります')
    }

    if (fuelLog.previousMileage < 0) {
      throw new Error('前回走行距離は0以上である必要があります')
    }

    if (fuelLog.previousMileage > fuelLog.mileage) {
      throw new Error('前回走行距離は給油時走行距離以下である必要があります')
    }

    this._value = fuelLog
  }

  public get id(): FuelLogId {
    return this._value.fuelLogId
  }

  public get myUserBikeId(): MyUserBikeId {
    return this._value.myUserBikeId
  }

  public get refueledAt(): Date {
    return this._value.refueledAt
  }

  public get mileage(): number {
    return this._value.mileage
  }

  public get previousMileage(): number {
    return this._value.previousMileage
  }

  public get amount(): number {
    return this._value.amount
  }

  public get totalPrice(): number {
    return this._value.totalPrice
  }

  public toJson(): FuelLog {
    return this._value
  }
}
