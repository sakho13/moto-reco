import type { ApiKeyScope } from '@repo/shared-types'
import { OAuthAuthorizationCodeEntity } from '../entities/OAuthAuthorizationCodeEntity'

export interface IOAuthAuthorizationCodeRepository {
  /**
   * 認可コードを新規作成する
   *
   * @remarks
   * `clientId` は `MOAuthClient.id`（内部cuid）を指定する。
   */
  create(params: {
    codeHash: string
    clientId: string
    userId: string
    redirectUri: string
    codeChallenge: string
    codeChallengeMethod: string
    scopes: ApiKeyScope[]
    expiresAt: Date
  }): Promise<OAuthAuthorizationCodeEntity>

  /**
   * ハッシュ化済みの認可コードからレコードを取得する
   */
  findByCodeHash(codeHash: string): Promise<OAuthAuthorizationCodeEntity | null>

  /**
   * 認可コードを使用済みにする
   */
  markUsed(id: string): Promise<void>
}
