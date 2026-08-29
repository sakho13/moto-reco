import type { ApiKeyScope } from '@repo/shared-types'
import { OAuthTokenEntity } from '../entities/OAuthTokenEntity'

export interface IOAuthTokenRepository {
  /**
   * アクセストークン・リフレッシュトークンのペアを新規作成する
   *
   * @remarks
   * `clientId` は `MOAuthClient.id`（内部cuid）を指定する。
   */
  create(params: {
    accessTokenHash: string
    refreshTokenHash: string | null
    clientId: string
    userId: string
    scopes: ApiKeyScope[]
    accessTokenExpiresAt: Date
    refreshTokenExpiresAt: Date | null
  }): Promise<OAuthTokenEntity>

  /**
   * ハッシュ化済みのアクセストークンからレコードを取得する
   */
  findByAccessTokenHash(
    accessTokenHash: string
  ): Promise<OAuthTokenEntity | null>

  /**
   * ハッシュ化済みのリフレッシュトークンからレコードを取得する
   */
  findByRefreshTokenHash(
    refreshTokenHash: string
  ): Promise<OAuthTokenEntity | null>

  /**
   * リフレッシュ時に同一レコードのトークンをローテーション（新しいハッシュ・有効期限で更新）する
   *
   * @remarks
   * `expectedRefreshTokenHash` を更新条件に含めた原子的な更新を行う。
   * 同一リフレッシュトークンに対する並行したリフレッシュリクエストで
   * 後勝ちの上書きが発生しないよう、実際に更新できた場合のみ
   * 更新後のエンティティを返し、既に他のリクエストでローテーション済みの場合は `null` を返す。
   */
  rotate(
    id: string,
    expectedRefreshTokenHash: string,
    params: {
      accessTokenHash: string
      refreshTokenHash: string | null
      accessTokenExpiresAt: Date
      refreshTokenExpiresAt: Date | null
    }
  ): Promise<OAuthTokenEntity | null>
}
