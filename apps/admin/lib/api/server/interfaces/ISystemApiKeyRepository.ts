import { SystemApiKeyEntity } from '../entities/SystemApiKeyEntity'

export interface ISystemApiKeyRepository {
  /**
   * システムAPIキー一覧を取得（全件、作成日時降順）
   */
  findAll(): Promise<SystemApiKeyEntity[]>

  /**
   * keyHashからシステムAPIキーを取得（認証用）
   */
  findByKeyHash(keyHash: string): Promise<SystemApiKeyEntity | null>

  /**
   * システムAPIキーを新規作成
   */
  create(params: {
    name: string
    keyHash: string
    prefix: string
  }): Promise<SystemApiKeyEntity>

  /**
   * isActiveを更新する
   */
  updateIsActive(id: string, isActive: boolean): Promise<SystemApiKeyEntity>

  /**
   * 最終利用日時を更新する
   */
  touchLastUsedAt(id: string, lastUsedAt: Date): Promise<void>
}
