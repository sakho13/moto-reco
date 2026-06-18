import { User, UserId } from '@repo/shared-types'
import { AccountLimitsValue } from '../valueObjects/AccountLimitsValue'

export class UserEntity {
  private _value: User

  constructor(user: User) {
    this._value = user
  }

  public get id(): UserId {
    return this._value.id
  }

  public get name(): string {
    return this._value.name
  }

  public get role(): string {
    return this._value.role
  }

  public get limits(): AccountLimitsValue {
    return AccountLimitsValue.from(this._value.role)
  }

  public get status(): string {
    return this._value.status
  }

  public get notificationEmail(): string | null {
    return this._value.notificationEmail
  }
  public get isProfilePublic(): boolean {
    return this._value.isProfilePublic
  }
  public get timezone(): string | null {
    return this._value.timezone
  }

  public set name(name: string) {
    if (!name || name.length === 0 || name.length > 50) {
      throw new Error('ユーザ名は1文字以上50文字以下である必要があります')
    }
    this._value.name = name
  }

  public set notificationEmail(email: string | null) {
    this._value.notificationEmail = email
  }
  public set isProfilePublic(isProfilePublic: boolean) {
    this._value.isProfilePublic = isProfilePublic
  }
  public set timezone(timezone: string | null) {
    this._value.timezone = timezone
  }

  public toJson(): User {
    return this._value
  }
}
