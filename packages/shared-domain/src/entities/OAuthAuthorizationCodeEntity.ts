import type { ApiKeyScope } from '@repo/shared-types'

/**
 * OAuth認可コードエンティティ
 *
 * @remarks
 * 認可コードグラント（PKCE付き）で発行される、有効期限の短い一度限りのコードを表現する。
 * `clientId` は `MOAuthClient.id`（内部cuid）を指す。
 */
export class OAuthAuthorizationCodeEntity {
  private _id: string
  private _codeHash: string
  private _clientId: string
  private _userId: string
  private _redirectUri: string
  private _codeChallenge: string
  private _codeChallengeMethod: string
  private _scopes: ApiKeyScope[]
  private _used: boolean
  private _expiresAt: Date
  private _createdAt: Date

  constructor(params: {
    id: string
    codeHash: string
    clientId: string
    userId: string
    redirectUri: string
    codeChallenge: string
    codeChallengeMethod: string
    scopes: ApiKeyScope[]
    used: boolean
    expiresAt: Date
    createdAt: Date
  }) {
    this._id = params.id
    this._codeHash = params.codeHash
    this._clientId = params.clientId
    this._userId = params.userId
    this._redirectUri = params.redirectUri
    this._codeChallenge = params.codeChallenge
    this._codeChallengeMethod = params.codeChallengeMethod
    this._scopes = params.scopes
    this._used = params.used
    this._expiresAt = params.expiresAt
    this._createdAt = params.createdAt
  }

  public get id(): string {
    return this._id
  }

  public get codeHash(): string {
    return this._codeHash
  }

  /** MOAuthClient.id（内部cuid） */
  public get clientId(): string {
    return this._clientId
  }

  public get userId(): string {
    return this._userId
  }

  public get redirectUri(): string {
    return this._redirectUri
  }

  public get codeChallenge(): string {
    return this._codeChallenge
  }

  public get codeChallengeMethod(): string {
    return this._codeChallengeMethod
  }

  public get scopes(): ApiKeyScope[] {
    return this._scopes
  }

  public get used(): boolean {
    return this._used
  }

  public get expiresAt(): Date {
    return this._expiresAt
  }

  public get createdAt(): Date {
    return this._createdAt
  }

  public isExpired(now: Date): boolean {
    return now.getTime() > this._expiresAt.getTime()
  }
}
