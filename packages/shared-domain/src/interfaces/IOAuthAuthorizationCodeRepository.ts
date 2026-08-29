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
   *
   * @remarks
   * `used: false` であることを更新条件に含めた原子的な更新を行う。
   * 同一コードに対する並行した交換リクエストで二重にトークンが
   * 発行されないよう、実際に更新できた場合のみ `true` を返す。
   */
  markUsed(id: string): Promise<boolean>
}
