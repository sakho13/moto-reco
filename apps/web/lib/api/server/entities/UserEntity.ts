import { type User, type UserId, type UserPlan } from '@repo/shared-types'
import { AccountLimitsValue } from '../valueObjects/AccountLimitsValue'

export class UserEntity {
  private _value: User
  private _plan: UserPlan | null

  constructor(user: User, plan: UserPlan | null) {
    this._value = user
    this._plan = plan
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

  /** 料金プラン（GUEST / ADMIN は null = 制限なし） */
  public get plan(): UserPlan | null {
    return this._plan
  }

  /** バイク/ツーリング等の登録上限 */
  public get limits(): AccountLimitsValue {
    return AccountLimitsValue.from(this._value.role, this._plan)
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

  public toJson(): User {
    return this._value
  }
}
