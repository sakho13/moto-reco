import { createHash, randomBytes } from 'crypto'
import type {
  OAuthClientEntity,
  OAuthTokenEndpointAuthMethod,
} from '../entities/OAuthClientEntity'
import { OAuthError } from '../errors/OAuthError'
import type { IOAuthClientRepository } from '../interfaces/IOAuthClientRepository'

export type RegisteredOAuthClient = {
  client: OAuthClientEntity
  /** confidential clientの場合のみ発行時に一度だけ返す平文シークレット */
  clientSecret: string | null
}

/**
 * redirect_uriとして許可しないスキーム
 *
 * @remarks
 * `javascript:` 等はブラウザ上で `window.location.href` に代入されると
 * MotoRecoのオリジンでスクリプトが実行され得るため拒否する。
 */
const DISALLOWED_REDIRECT_URI_SCHEMES = new Set([
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
])

/**
 * OAuthクライアント登録・検証を担うサービス
 *
 * @remarks
 * Dynamic Client Registration（RFC 7591）でのクライアント登録、
 * および認可・トークンエンドポイントでのクライアント検証（redirect_uri・client_secret）を担う。
 */
export class OAuthClientService {
  constructor(private readonly _clientRepository: IOAuthClientRepository) {}

  /**
   * Dynamic Client Registration（RFC 7591）
   *
   * @remarks
   * redirect_uris はMCP仕様に忠実に任意の値を許可する（ドメイン制限なし）。
   */
  async registerClient(params: {
    clientName?: string
    redirectUris: string[]
    tokenEndpointAuthMethod?: string
  }): Promise<RegisteredOAuthClient> {
    if (!params.redirectUris || params.redirectUris.length === 0) {
      throw new OAuthError(
        'invalid_client_metadata',
        'redirect_uris は必須です'
      )
    }
    for (const uri of params.redirectUris) {
      let parsed: URL
      try {
        parsed = new URL(uri)
      } catch {
        throw new OAuthError(
          'invalid_client_metadata',
          `redirect_uri の形式が不正です: ${uri}`
        )
      }
      if (DISALLOWED_REDIRECT_URI_SCHEMES.has(parsed.protocol.toLowerCase())) {
        throw new OAuthError(
          'invalid_client_metadata',
          `redirect_uri に許可されないスキームが指定されています: ${uri}`
        )
      }
      if (parsed.hash) {
        throw new OAuthError(
          'invalid_client_metadata',
          `redirect_uri にフラグメントを含めることはできません: ${uri}`
        )
      }
    }

    const authMethod: OAuthTokenEndpointAuthMethod =
      params.tokenEndpointAuthMethod === 'client_secret_basic'
        ? 'CLIENT_SECRET_BASIC'
        : 'NONE'

    let clientSecret: string | null = null
    let clientSecretHash: string | null = null
    if (authMethod === 'CLIENT_SECRET_BASIC') {
      clientSecret = randomBytes(32).toString('base64url')
      clientSecretHash = createHash('sha256').update(clientSecret).digest('hex')
    }

    const clientId = `mcpc_${randomBytes(16).toString('hex')}`

    const client = await this._clientRepository.create({
      clientId,
      clientSecretHash,
      clientName: params.clientName?.trim() || 'Unnamed MCP Client',
      redirectUris: params.redirectUris,
      tokenEndpointAuthMethod: authMethod,
    })

    return { client, clientSecret }
  }

  /**
   * clientId（OAuth仕様上の公開ID文字列）からクライアントを取得する
   *
   * @remarks
   * 存在しなければ invalid_client エラーを投げる。
   */
  async getClientOrThrow(clientId: string): Promise<OAuthClientEntity> {
    const client = await this._clientRepository.findByClientId(clientId)
    if (!client) {
      throw new OAuthError('invalid_client', '登録されていないクライアントです')
    }
    return client
  }

  /**
   * redirect_uriが登録済みのURIと完全一致するか検証する
   */
  verifyRedirectUri(client: OAuthClientEntity, redirectUri: string): void {
    if (!redirectUri || !client.hasRedirectUri(redirectUri)) {
      throw new OAuthError(
        'invalid_request',
        'redirect_uri が登録済みのURIと一致しません'
      )
    }
  }

  /**
   * confidential client（client_secret_basic）の場合のみclient_secretを検証する
   */
  verifyClientSecret(
    client: OAuthClientEntity,
    clientSecret: string | undefined
  ): void {
    if (!client.isConfidential()) return
    if (!clientSecret) {
      throw new OAuthError('invalid_client', 'client_secret が必要です', 401)
    }
    const hash = createHash('sha256').update(clientSecret).digest('hex')
    if (hash !== client.clientSecretHash) {
      throw new OAuthError('invalid_client', 'client_secret が不正です', 401)
    }
  }
}
