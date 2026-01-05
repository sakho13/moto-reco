import {
  UserQuit,
  UserQuitId,
  UserQuitStatus,
  UserId,
} from '@repo/shared-types'

export class UserQuitEntity {
  private _value: UserQuit

  constructor(userQuit: UserQuit) {
    this._value = userQuit
  }

  public get id(): UserQuitId {
    return this._value.id
  }

  public get userId(): UserId {
    return this._value.userId
  }

  public get quitReason(): string {
    return this._value.quitReason
  }

  public get quitAt(): Date {
    return this._value.quitAt
  }

  public get recoveryCode(): string {
    return this._value.recoveryCode
  }

  public get status(): UserQuitStatus {
    return this._value.status
  }

  public toJson(): UserQuit {
    return this._value
  }
}
