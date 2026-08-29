export type OAuthTokenEndpointAuthMethod = 'NONE' | 'CLIENT_SECRET_BASIC'

/**
 * OAuthクライアントエンティティ
 *
 * @remarks
 * Dynamic Client Registration（RFC 7591）で登録されたMCPクライアントを表現する。
 * ユーザーには紐付かない（クライアント自体はアプリケーション単位の登録情報）。
 */
export class OAuthClientEntity {
  private _id: string
  private _clientId: string
  private _clientSecretHash: string | null
  private _clientName: string
  private _redirectUris: string[]
  private _tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod
  private _createdAt: Date
  private _updatedAt: Date

  constructor(params: {
    id: string
    clientId: string
    clientSecretHash: string | null
    clientName: string
    redirectUris: string[]
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod
    createdAt: Date
    updatedAt: Date
  }) {
    this._id = params.id
    this._clientId = params.clientId
    this._clientSecretHash = params.clientSecretHash
    this._clientName = params.clientName
    this._redirectUris = params.redirectUris
    this._tokenEndpointAuthMethod = params.tokenEndpointAuthMethod
    this._createdAt = params.createdAt
    this._updatedAt = params.updatedAt
  }

  public get id(): string {
    return this._id
  }

  public get clientId(): string {
    return this._clientId
  }

  /**
   * ハッシュ化済みのclient_secret（内部用途のみ）
   *
   * @remarks
   * 外部公開APIレスポンスには絶対に含めないこと。
   */
  public get clientSecretHash(): string | null {
    return this._clientSecretHash
  }

  public get clientName(): string {
    return this._clientName
  }

  public get redirectUris(): string[] {
    return this._redirectUris
  }

  public get tokenEndpointAuthMethod(): OAuthTokenEndpointAuthMethod {
    return this._tokenEndpointAuthMethod
  }

  public get createdAt(): Date {
    return this._createdAt
  }

  public get updatedAt(): Date {
    return this._updatedAt
  }

  /**
   * redirect_uriが登録済みのURIと完全一致するか判定する
   *
   * @remarks
   * OAuth 2.1のセキュリティ要件により、部分一致・前方一致は許可しない。
   */
  public hasRedirectUri(redirectUri: string): boolean {
    return this._redirectUris.includes(redirectUri)
  }

  public isConfidential(): boolean {
    return this._tokenEndpointAuthMethod === 'CLIENT_SECRET_BASIC'
  }
}
