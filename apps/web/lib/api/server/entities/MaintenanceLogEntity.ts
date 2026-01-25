import {
  MaintenanceLog,
  MaintenanceLogId,
  MaintenanceLogItem,
  MyUserBikeId,
} from '@repo/shared-types'

const ensureUniqueMaintenanceItems = (items: MaintenanceLogItem[]): void => {
  const typeSet = new Set(items.map((item) => item.type))
  if (typeSet.size !== items.length) {
    throw new Error('メンテナンス項目が重複しています')
  }
}

export class MaintenanceLogEntity {
  private _value: MaintenanceLog

  constructor(maintenanceLog: MaintenanceLog) {
    if (maintenanceLog.mileage < 0) {
      throw new Error('走行距離は0以上である必要があります')
    }

    if (maintenanceLog.items.length === 0) {
      throw new Error('メンテナンス項目は1件以上必要です')
    }

    maintenanceLog.items.forEach((item) => {
      if (item.value.trim().length === 0) {
        throw new Error('メンテナンス項目の値は必須です')
      }
    })

    ensureUniqueMaintenanceItems(maintenanceLog.items)

    this._value = maintenanceLog
  }

  public get id(): MaintenanceLogId {
    return this._value.maintenanceLogId
  }

  public get myUserBikeId(): MyUserBikeId {
    return this._value.myUserBikeId
  }

  public get performedAt(): Date {
    return this._value.performedAt
  }

  public get mileage(): number {
    return this._value.mileage
  }

  public get memo(): string | null {
    return this._value.memo
  }

  public get items(): MaintenanceLogItem[] {
    return this._value.items
  }

  public toJson(): MaintenanceLog {
    return this._value
  }
}
