import { User, UserId } from '@shared-types/index'

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

  public get status(): string {
    return this._value.status
  }

  public set name(name: string) {
    if (!name || name.length === 0 || name.length > 50) {
      throw new Error('ユーザ名は1文字以上50文字以下である必要があります')
    }
    this._value.name = name
  }

  public toJson(): User {
    return this._value
  }
}
