import { createHash, randomBytes } from 'crypto'
import { SystemApiKeyEntity } from '../entities/SystemApiKeyEntity'
import type { ISystemApiKeyRepository } from '../interfaces/ISystemApiKeyRepository'

export type GeneratedSystemApiKey = {
  systemApiKey: SystemApiKeyEntity
  /** 平文のフルキー（発行時のみ返す） */
  fullKey: string
}

/**
 * システム共通APIキー（内部バッチAPI保護用）の発行・照合・失効を扱うサービス
 *
 * @remarks
 * `ApiKeyService` と同一の生成・ハッシュ照合パターンを踏襲する。
 * ユーザーに紐づかないため、呼び出し元（管理者API）でADMINロールを確認すること。
 */
export class SystemApiKeyService {
  constructor(
    private readonly _systemApiKeyRepository: ISystemApiKeyRepository
  ) {}

  /**
   * システムAPIキーを生成して保存する
   */
  async generateApiKey(params: {
    name: string
  }): Promise<GeneratedSystemApiKey> {
    const prefix = `sk_${randomBytes(4).toString('hex')}`
    const secret = randomBytes(32).toString('base64url')
    const fullKey = `${prefix}_${secret}`
    const keyHash = createHash('sha256').update(fullKey).digest('hex')

    const systemApiKey = await this._systemApiKeyRepository.create({
      name: params.name,
      keyHash,
      prefix,
    })

    return { systemApiKey, fullKey }
  }

  /**
   * システムAPIキー一覧を取得
   */
  async listApiKeys(): Promise<SystemApiKeyEntity[]> {
    return this._systemApiKeyRepository.findAll()
  }

  /**
   * システムAPIキーのisActiveを切り替える
   */
  async setActive(id: string, isActive: boolean): Promise<SystemApiKeyEntity> {
    return this._systemApiKeyRepository.updateIsActive(id, isActive)
  }

  /**
   * システムAPIキー（fullKey）を検証する（内部API認証用）
   *
   * @remarks
   * 検証成功時はlastUsedAtを更新する。
   */
  async verifyApiKey(fullKey: string): Promise<boolean> {
    const keyHash = createHash('sha256').update(fullKey).digest('hex')
    const apiKey = await this._systemApiKeyRepository.findByKeyHash(keyHash)
    if (!apiKey || !apiKey.isActive) return false

    await this._systemApiKeyRepository.touchLastUsedAt(apiKey.id, new Date())
    return true
  }
}
