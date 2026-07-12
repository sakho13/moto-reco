import type { ApiKeyScope } from '@repo/shared-types'
import { ApiKeyEntity } from '../entities/ApiKeyEntity'

export interface IApiKeyRepository {
  /**
   * ユーザーのAPIキー一覧を取得（アクティブのみ）
   */
  findByUserId(userId: string): Promise<ApiKeyEntity[]>

  /**
   * keyHashからAPIキーを取得（認証用）
   */
  findByKeyHash(keyHash: string): Promise<ApiKeyEntity | null>

  /**
   * ユーザーのアクティブなAPIキー数を取得
   */
  countActiveByUserId(userId: string): Promise<number>

  /**
   * APIキーを新規作成
   */
  create(params: {
    userId: string
    name: string
    keyHash: string
    prefix: string
    scopes: ApiKeyScope[]
  }): Promise<ApiKeyEntity>

  /**
   * APIキーを失効（isActive = false）
   */
  revoke(apiKeyId: string, userId: string): Promise<void>

  /**
   * APIキーを削除
   */
  delete(apiKeyId: string, userId: string): Promise<void>
}
