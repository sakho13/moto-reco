import {
  UserPlanHistory,
  UserPlanHistoryId,
  UserPlan,
  UserId,
} from '@repo/shared-types'

export class UserPlanHistoryEntity {
  private _value: UserPlanHistory

  constructor(value: UserPlanHistory) {
    this._value = value
  }

  public get id(): UserPlanHistoryId {
    return this._value.id
  }

  public get userId(): UserId {
    return this._value.userId
  }

  public get plan(): UserPlan {
    return this._value.plan
  }

  public get changedAt(): Date {
    return this._value.changedAt
  }

  public get changedById(): UserId {
    return this._value.changedById
  }

  public get reason(): string | null {
    return this._value.reason
  }

  public toJson(): UserPlanHistory {
    return this._value
  }
}
