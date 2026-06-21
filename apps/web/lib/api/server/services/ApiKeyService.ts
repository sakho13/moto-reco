import { createHash, randomBytes } from 'crypto'
import type { UserPlan } from '@repo/shared-types'
import { ApiKeyEntity } from '../entities/ApiKeyEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IApiKeyRepository } from '../interfaces/IApiKeyRepository'
import { PlanLimitsValue } from '../valueObjects/PlanLimitsValue'

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
   * GUESTは利用不可。プラン別制限は planLimits で管理する。
   * fullKey は発行時のみ返すため、呼び出し元で安全に扱うこと。
   */
  async generateApiKey(params: {
    userId: string
    role: 'USER' | 'ADMIN' | 'GUEST'
    plan: UserPlan
    name: string
  }): Promise<GeneratedApiKey> {
    if (params.role === 'GUEST') {
      throw new ApiV1Error(
        'FORBIDDEN',
        'ゲストアカウントはAPIキーを発行できません'
      )
    }

    const planLimits = PlanLimitsValue.from(params.plan)
    if (planLimits.apiKey !== null) {
      const count = await this._apiKeyRepository.countActiveByUserId(
        params.userId
      )
      if (planLimits.isOver('apiKey', count)) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          planLimits.limitMessage('apiKey')
        )
      }
    }

    const prefix = `mk_${randomBytes(4).toString('hex')}`
    const secret = randomBytes(32).toString('base64url')
    const fullKey = `${prefix}_${secret}`
    const keyHash = createHash('sha256').update(fullKey).digest('hex')

    const apiKey = await this._apiKeyRepository.create({
      userId: params.userId,
      name: params.name,
      keyHash,
      prefix,
    })

    return { apiKey, fullKey }
  }

  /**
   * ユーザーのAPIキー一覧を取得
   */
  async listApiKeys(params: {
    userId: string
    role: 'USER' | 'ADMIN' | 'GUEST'
  }): Promise<ApiKeyEntity[]> {
    if (params.role === 'GUEST') {
      throw new ApiV1Error(
        'FORBIDDEN',
        'ゲストアカウントはAPIキーを利用できません'
      )
    }
    return this._apiKeyRepository.findByUserId(params.userId)
  }

  /**
   * APIキーを失効させる
   */
  async revokeApiKey(params: {
    userId: string
    role: 'USER' | 'ADMIN' | 'GUEST'
    apiKeyId: string
  }): Promise<void> {
    if (params.role === 'GUEST') {
      throw new ApiV1Error(
        'FORBIDDEN',
        'ゲストアカウントはAPIキーを利用できません'
      )
    }
    await this._apiKeyRepository.revoke(params.apiKeyId, params.userId)
  }

  /**
   * APIキーを削除する
   */
  async deleteApiKey(params: {
    userId: string
    role: 'USER' | 'ADMIN' | 'GUEST'
    apiKeyId: string
  }): Promise<void> {
    if (params.role === 'GUEST') {
      throw new ApiV1Error(
        'FORBIDDEN',
        'ゲストアカウントはAPIキーを利用できません'
      )
    }
    await this._apiKeyRepository.delete(params.apiKeyId, params.userId)
  }

  /**
   * APIキー（fullKey）を検証してuserId・planを返す（MCP認証用）
   */
  async verifyApiKey(fullKey: string): Promise<{
    userId: string
  } | null> {
    const keyHash = createHash('sha256').update(fullKey).digest('hex')
    const apiKey = await this._apiKeyRepository.findByKeyHash(keyHash)
    if (!apiKey || !apiKey.isActive) return null
    return { userId: apiKey.userId }
  }
}
