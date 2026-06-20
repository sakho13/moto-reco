/**
 * APIキーエンティティ
 *
 * @remarks
 * MCPクライアント連携用のAPIキーを表現する。
 * keyHashのみDBに保存し、平文は発行時に一度だけ返す。
 */
export class ApiKeyEntity {
  private _id: string
  private _userId: string
  private _name: string
  private _keyHash: string
  private _prefix: string
  private _isActive: boolean
  private _createdAt: Date
  private _updatedAt: Date

  constructor(params: {
    id: string
    userId: string
    name: string
    keyHash: string
    prefix: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }) {
    this._id = params.id
    this._userId = params.userId
    this._name = params.name
    this._keyHash = params.keyHash
    this._prefix = params.prefix
    this._isActive = params.isActive
    this._createdAt = params.createdAt
    this._updatedAt = params.updatedAt
  }

  public get id(): string {
    return this._id
  }

  public get userId(): string {
    return this._userId
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

  public get createdAt(): Date {
    return this._createdAt
  }

  public get updatedAt(): Date {
    return this._updatedAt
  }

  public revoke(): void {
    this._isActive = false
  }
}
