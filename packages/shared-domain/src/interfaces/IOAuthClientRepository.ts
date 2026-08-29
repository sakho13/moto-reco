import {
  OAuthClientEntity,
  OAuthTokenEndpointAuthMethod,
} from '../entities/OAuthClientEntity'

export interface IOAuthClientRepository {
  /**
   * OAuth仕様上の公開client_id文字列からクライアントを取得する
   */
  findByClientId(clientId: string): Promise<OAuthClientEntity | null>

  /**
   * クライアントを新規作成（Dynamic Client Registration）
   */
  create(params: {
    clientId: string
    clientSecretHash: string | null
    clientName: string
    redirectUris: string[]
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod
  }): Promise<OAuthClientEntity>
}
