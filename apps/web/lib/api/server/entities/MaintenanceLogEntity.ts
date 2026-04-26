import {
  MaintenanceLog,
  MaintenanceLogId,
  MaintenanceLogItem,
  MyUserBikeId,
} from '@repo/shared-types'
import { ApiV1Error } from '../errors/ApiV1Error'

export class MaintenanceLogEntity {
  private _value: MaintenanceLog

  constructor(maintenanceLog: MaintenanceLog) {
    if (maintenanceLog.mileage < 0) {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        '走行距離は0以上である必要があります'
      )
    }

    if (maintenanceLog.items.length === 0) {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'メンテナンス項目は1件以上指定してください'
      )
    }

    const types = new Set<string>()
    for (const item of maintenanceLog.items) {
      if (item.value !== null && item.value < 0) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          'メンテナンス値は0以上である必要があります'
        )
      }
      if (types.has(item.maintenanceType)) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          'メンテナンス項目は重複して指定できません'
        )
      }
      types.add(item.maintenanceType)
    }

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
