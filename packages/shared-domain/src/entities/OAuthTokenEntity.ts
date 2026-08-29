import type { ApiKeyScope } from '@repo/shared-types'

/**
 * OAuthトークンエンティティ
 *
 * @remarks
 * アクセストークン・リフレッシュトークンのペアを表現する。
 * `clientId` は `MOAuthClient.id`（内部cuid）を指す。
 */
export class OAuthTokenEntity {
  private _id: string
  private _accessTokenHash: string
  private _refreshTokenHash: string | null
  private _clientId: string
  private _userId: string
  private _scopes: ApiKeyScope[]
  private _revoked: boolean
  private _accessTokenExpiresAt: Date
  private _refreshTokenExpiresAt: Date | null
  private _createdAt: Date
  private _updatedAt: Date

  constructor(params: {
    id: string
    accessTokenHash: string
    refreshTokenHash: string | null
    clientId: string
    userId: string
    scopes: ApiKeyScope[]
    revoked: boolean
    accessTokenExpiresAt: Date
    refreshTokenExpiresAt: Date | null
    createdAt: Date
    updatedAt: Date
  }) {
    this._id = params.id
    this._accessTokenHash = params.accessTokenHash
    this._refreshTokenHash = params.refreshTokenHash
    this._clientId = params.clientId
    this._userId = params.userId
    this._scopes = params.scopes
    this._revoked = params.revoked
    this._accessTokenExpiresAt = params.accessTokenExpiresAt
    this._refreshTokenExpiresAt = params.refreshTokenExpiresAt
    this._createdAt = params.createdAt
    this._updatedAt = params.updatedAt
  }

  public get id(): string {
    return this._id
  }

  public get accessTokenHash(): string {
    return this._accessTokenHash
  }

  public get refreshTokenHash(): string | null {
    return this._refreshTokenHash
  }

  /** MOAuthClient.id（内部cuid） */
  public get clientId(): string {
    return this._clientId
  }

  public get userId(): string {
    return this._userId
  }

  public get scopes(): ApiKeyScope[] {
    return this._scopes
  }

  public get revoked(): boolean {
    return this._revoked
  }

  public get accessTokenExpiresAt(): Date {
    return this._accessTokenExpiresAt
  }

  public get refreshTokenExpiresAt(): Date | null {
    return this._refreshTokenExpiresAt
  }

  public get createdAt(): Date {
    return this._createdAt
  }

  public get updatedAt(): Date {
    return this._updatedAt
  }

  public isAccessTokenExpired(now: Date): boolean {
    return now.getTime() > this._accessTokenExpiresAt.getTime()
  }

  public isRefreshTokenExpired(now: Date): boolean {
    if (!this._refreshTokenExpiresAt) return true
    return now.getTime() > this._refreshTokenExpiresAt.getTime()
  }
}
