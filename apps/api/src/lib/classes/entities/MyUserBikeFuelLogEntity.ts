import { MyUserBikeFuelLog } from '@shared-types/index'

export class MyUserBikeFuelLogEntity {
  private _value: MyUserBikeFuelLog

  constructor(fuelLog: MyUserBikeFuelLog) {
    if (fuelLog.amount <= 0) {
      throw new Error('給油量は1以上である必要があります')
    }

    if (fuelLog.mileage < 0) {
      throw new Error('給油時走行距離は0以上である必要があります')
    }

    if (fuelLog.totalPrice < 0) {
      throw new Error('合計価格は0以上である必要があります')
    }

    this._value = fuelLog
  }

  public get id() {
    return this._value.fuelLogId
  }

  public get myUserBikeId() {
    return this._value.myUserBikeId
  }

  public get refueledAt() {
    return this._value.refueledAt
  }

  public get mileage() {
    return this._value.mileage
  }

  public get amount() {
    return this._value.amount
  }

  public get totalPrice() {
    return this._value.totalPrice
  }

  public toJson() {
    return this._value
  }
}
