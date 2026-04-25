import {
  BikeHistoryType,
  FuelLogId,
  History,
  HistoryId,
  MyUserBikeId,
  PostId,
  TouringId,
  UserId,
} from '@repo/shared-types'

export class HistoryEntity {
  private _value: History

  constructor(history: History) {
    this._value = history
  }

  public get id(): HistoryId {
    return this._value.historyId
  }

  public get userId(): UserId {
    return this._value.userId
  }

  public get userMyBikeId(): MyUserBikeId | null {
    return this._value.userMyBikeId
  }

  public get type(): BikeHistoryType {
    return this._value.type
  }

  public get occurredAt(): Date {
    return this._value.occurredAt
  }

  public get fuelLogId(): FuelLogId | null {
    return this._value.fuelLogId
  }

  public get touringId(): TouringId | null {
    return this._value.touringId
  }

  public get postId(): PostId | null {
    return this._value.postId
  }

  public toJson(): History {
    return this._value
  }
}
