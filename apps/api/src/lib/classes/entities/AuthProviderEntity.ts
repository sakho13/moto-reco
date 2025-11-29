import { AuthProvider } from '@shared-types/index'

export class AuthProviderEntity {
  private _value: AuthProvider

  constructor(authProvider: AuthProvider) {
    this._value = authProvider
  }

  public get userId(): string {
    return this._value.userId
  }

  public get provider(): string {
    return this._value.providerType
  }

  public get externalId(): string {
    return this._value.externalId
  }

  public get metadata(): Record<string, unknown> | undefined {
    return this._value.metadata
  }

  public get isActive(): boolean {
    return this._value.isActive
  }

  public toJSON(): AuthProvider {
    return this._value
  }
}
