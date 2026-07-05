import { createHash, randomBytes } from 'crypto'
import type { ApiKeyScope } from '@repo/shared-types'
import { ApiKeyEntity } from '../entities/ApiKeyEntity'
import { UserEntity } from '../entities/UserEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import type { IApiKeyRepository } from '../interfaces/IApiKeyRepository'

export type GeneratedApiKey = {
  apiKey: ApiKeyEntity
  /** 平文のフルキー（発行時のみ返す） */
  fullKey: string
}

export class ApiKeyService {
  constructor(private readonly _apiKeyRepository: IApiKeyRepository) {}

  /**
   * APIキーを生成して保存する
   *
   * @remarks
   * GUESTは利用不可。プラン別制限は userEntity.limits で管理する。
   * fullKey は発行時のみ返すため、呼び出し元で安全に扱うこと。
   */
  async generateApiKey(params: {
    user: UserEntity
    name: string
    scopes: ApiKeyScope[]
  }): Promise<GeneratedApiKey> {
    if (params.user.role === 'GUEST') {
      throw new ApiV1Error(
        'FORBIDDEN',
        'ゲストアカウントはAPIキーを発行できません'
      )
    }

    const limits = params.user.limits
    if (limits.apiKey !== null) {
      const count = await this._apiKeyRepository.countActiveByUserId(
        String(params.user.id)
      )
      if (limits.isOver('apiKey', count)) {
        throw new ApiV1Error('INVALID_REQUEST', limits.limitMessage('apiKey'))
      }
    }

    if (params.scopes.length === 0) {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'スコープを1つ以上選択してください'
      )
    }

    const allowedScopes = limits.allowedScopes
    const invalidScopes = params.scopes.filter(
      (s) => !allowedScopes.includes(s)
    )
    if (invalidScopes.length > 0) {
      throw new ApiV1Error(
        'FORBIDDEN',
        '選択されたスコープは現在のプランでは使用できません'
      )
    }

    const prefix = `mk_${randomBytes(4).toString('hex')}`
    const secret = randomBytes(32).toString('base64url')
    const fullKey = `${prefix}_${secret}`
    const keyHash = createHash('sha256').update(fullKey).digest('hex')

    const apiKey = await this._apiKeyRepository.create({
      userId: String(params.user.id),
      name: params.name,
      keyHash,
      prefix,
      scopes: params.scopes,
    })

    return { apiKey, fullKey }
  }

  /**
   * ユーザーのAPIキー一覧を取得
   */
  async listApiKeys(params: { user: UserEntity }): Promise<ApiKeyEntity[]> {
    if (params.user.role === 'GUEST') {
      throw new ApiV1Error(
        'FORBIDDEN',
        'ゲストアカウントはAPIキーを利用できません'
      )
    }
    return this._apiKeyRepository.findByUserId(String(params.user.id))
  }

  /**
   * APIキーを失効させる
   */
  async revokeApiKey(params: {
    user: UserEntity
    apiKeyId: string
  }): Promise<void> {
    if (params.user.role === 'GUEST') {
      throw new ApiV1Error(
        'FORBIDDEN',
        'ゲストアカウントはAPIキーを利用できません'
      )
    }
    await this._apiKeyRepository.revoke(params.apiKeyId, String(params.user.id))
  }

  /**
   * APIキーを削除する
   */
  async deleteApiKey(params: {
    user: UserEntity
    apiKeyId: string
  }): Promise<void> {
    if (params.user.role === 'GUEST') {
      throw new ApiV1Error(
        'FORBIDDEN',
        'ゲストアカウントはAPIキーを利用できません'
      )
    }
    await this._apiKeyRepository.delete(params.apiKeyId, String(params.user.id))
  }

  /**
   * APIキー（fullKey）を検証してuserId・planを返す（MCP認証用）
   */
  async verifyApiKey(fullKey: string): Promise<{
    userId: string
    scopes: ApiKeyScope[]
  } | null> {
    const keyHash = createHash('sha256').update(fullKey).digest('hex')
    const apiKey = await this._apiKeyRepository.findByKeyHash(keyHash)
    if (!apiKey || !apiKey.isActive) return null
    return { userId: apiKey.userId, scopes: apiKey.scopes }
  }
}
