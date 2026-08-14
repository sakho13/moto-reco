/**
 * システム共通APIキーエンティティ
 *
 * @remarks
 * 内部バッチAPI（完全削除バッチ等）を保護するためのAPIキーを表現する。
 * 特定ユーザーには紐づかない。keyHashのみDBに保存し、平文は発行時に一度だけ返す。
 */
export class SystemApiKeyEntity {
  private _id: string
  private _name: string
  private _keyHash: string
  private _prefix: string
  private _isActive: boolean
  private _lastUsedAt: Date | null
  private _createdAt: Date
  private _updatedAt: Date

  constructor(params: {
    id: string
    name: string
    keyHash: string
    prefix: string
    isActive: boolean
    lastUsedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }) {
    this._id = params.id
    this._name = params.name
    this._keyHash = params.keyHash
    this._prefix = params.prefix
    this._isActive = params.isActive
    this._lastUsedAt = params.lastUsedAt
    this._createdAt = params.createdAt
    this._updatedAt = params.updatedAt
  }

  public get id(): string {
    return this._id
  }

  public get name(): string {
    return this._name
  }

  public get keyHash(): string {
    return this._keyHash
  }

  public get prefix(): string {
    return this._prefix
  }

  public get isActive(): boolean {
    return this._isActive
  }

  public get lastUsedAt(): Date | null {
    return this._lastUsedAt
  }

  public get createdAt(): Date {
    return this._createdAt
  }

  public get updatedAt(): Date {
    return this._updatedAt
  }
}
