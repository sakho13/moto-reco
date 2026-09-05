import { createHash, randomBytes } from 'crypto'
import type {
  IOAuthAuthorizationCodeRepository,
  IOAuthClientRepository,
  IOAuthTokenRepository,
  IUserRepository,
  UserEntity,
} from '@repo/shared-domain'
import type { ApiKeyScope } from '@repo/shared-types'
import { createUserId } from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'
import { OAuthError } from '../errors/OAuthError'
import { OAuthClientService } from './OAuthClientService'

const ALLOWED_SCOPES: ApiKeyScope[] = ['READ', 'WRITE']
const AUTHORIZATION_CODE_TTL_MS = 10 * 60 * 1000
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

export type IssuedTokens = {
  accessToken: string
  refreshToken: string | null
  scopes: ApiKeyScope[]
  expiresIn: number
}

/**
 * OAuth認可コードグラント（PKCE）・トークン発行/リフレッシュ/検証を担うサービス
 *
 * @remarks
 * このクラス内の `clientId` パラメータは基本的に
 * **OAuth仕様上の公開client_id文字列**（リクエストから受け取る値）を指し、
 * `client.id` は **内部cuid**（DB保存用の外部キー）を指す。
 */
export class OAuthAuthorizationService {
  private readonly _clientService: OAuthClientService

  constructor(
    private readonly _clientRepository: IOAuthClientRepository,
    private readonly _codeRepository: IOAuthAuthorizationCodeRepository,
    private readonly _tokenRepository: IOAuthTokenRepository,
    private readonly _userRepository: IUserRepository
  ) {
    this._clientService = new OAuthClientService(_clientRepository)
  }

  /**
   * OAuthのscopeパラメータ（スペース区切り文字列）をApiKeyScope[]に変換・検証する
   *
   * @remarks
   * `ALLOWED_SCOPES`（OAuth仕様上サポートするscope全体）でのバリデーション後、
   * さらに `allowedScopes`（ユーザーの現在のプランで許可されているscope）との
   * 積集合を取る。積集合が空の場合はプラン超過のscope要求とみなしエラーとする。
   */
  private parseScopes(
    scope: string | undefined,
    allowedScopes: ApiKeyScope[]
  ): ApiKeyScope[] {
    const requested = scope
      ? scope
          .split(' ')
          .map((s) => s.trim().toUpperCase())
          .filter((s) => s.length > 0)
      : ['READ']
    const validated = requested.filter((s): s is ApiKeyScope =>
      (ALLOWED_SCOPES as string[]).includes(s)
    )
    const scopes = validated.filter((s) => allowedScopes.includes(s))
    if (scopes.length === 0) {
      throw new OAuthError('invalid_scope', '有効なscopeが指定されていません')
    }
    return Array.from(new Set(scopes))
  }

  /** userIdからUserEntityを取得する（存在しない・退会済みの場合はnull） */
  private async findUser(userId: string): Promise<UserEntity | null> {
    return this._userRepository.findById(createUserId(userId))
  }

  /**
   * ユーザーがMCPを利用可能な状態か検証する
   *
   * @remarks
   * 退会・停止済み（`findById`がACTIVE以外を除外して`null`を返す）、
   * およびゲストアカウントを無効とみなす。
   */
  private async isUsableUser(userId: string): Promise<boolean> {
    const user = await this.findUser(userId)
    return user !== null && user.role !== 'GUEST'
  }

  /**
   * 同意画面での「承認」時に呼ばれる。認可コードを発行する
   *
   * @remarks
   * `params.clientId` はOAuth仕様上の公開client_id文字列。
   */
  async createAuthorizationCode(params: {
    clientId: string
    userId: string
    redirectUri: string
    codeChallenge: string
    codeChallengeMethod: string
    scope?: string
  }): Promise<{ code: string }> {
    const client = await this._clientService.getClientOrThrow(params.clientId)
    this._clientService.verifyRedirectUri(client, params.redirectUri)

    if (params.codeChallengeMethod !== 'S256') {
      throw new OAuthError(
        'invalid_request',
        'code_challenge_method は S256 のみサポートしています'
      )
    }
    if (!params.codeChallenge) {
      throw new OAuthError('invalid_request', 'code_challenge は必須です')
    }

    const user = await this.findUser(params.userId)
    if (!user) {
      throw new OAuthError('access_denied', 'ユーザーが無効です')
    }

    const scopes = this.parseScopes(params.scope, user.limits.allowedScopes)

    const code = randomBytes(32).toString('base64url')
    const codeHash = createHash('sha256').update(code).digest('hex')
    const expiresAt = new Date(
      getCurrentDate().getTime() + AUTHORIZATION_CODE_TTL_MS
    )

    await this._codeRepository.create({
      codeHash,
      clientId: client.id,
      userId: params.userId,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      scopes,
      expiresAt,
    })

    return { code }
  }

  /**
   * 認可コードをアクセストークン/リフレッシュトークンに交換する（PKCE検証必須）
   *
   * @remarks
   * `params.clientId` はOAuth仕様上の公開client_id文字列。
   */
  async exchangeAuthorizationCode(params: {
    code: string
    codeVerifier: string
    clientId: string
    redirectUri: string
  }): Promise<IssuedTokens> {
    const client = await this._clientService.getClientOrThrow(params.clientId)

    const codeHash = createHash('sha256').update(params.code).digest('hex')
    const authCode = await this._codeRepository.findByCodeHash(codeHash)

    if (!authCode || authCode.used || authCode.clientId !== client.id) {
      throw new OAuthError('invalid_grant', '認可コードが無効です')
    }
    if (authCode.isExpired(getCurrentDate())) {
      throw new OAuthError(
        'invalid_grant',
        '認可コードの有効期限が切れています'
      )
    }
    if (authCode.redirectUri !== params.redirectUri) {
      throw new OAuthError('invalid_grant', 'redirect_uri が一致しません')
    }

    this.verifyPkce(authCode.codeChallenge, params.codeVerifier)

    if (!(await this.isUsableUser(authCode.userId))) {
      throw new OAuthError('invalid_grant', 'ユーザーが無効です')
    }

    // used: false を条件にした原子的な更新。並行した交換リクエストによる
    // 認可コードの二重使用（二重トークン発行）を防ぐ。
    const marked = await this._codeRepository.markUsed(authCode.id)
    if (!marked) {
      throw new OAuthError('invalid_grant', '認可コードは既に使用されています')
    }

    return this.issueTokens(client.id, authCode.userId, authCode.scopes)
  }

  /**
   * リフレッシュトークンでアクセストークンを再発行する（リフレッシュトークンもローテーションする）
   *
   * @remarks
   * `params.clientId` はOAuth仕様上の公開client_id文字列。
   */
  async refreshAccessToken(params: {
    refreshToken: string
    clientId: string
  }): Promise<IssuedTokens> {
    const client = await this._clientService.getClientOrThrow(params.clientId)

    const refreshTokenHash = createHash('sha256')
      .update(params.refreshToken)
      .digest('hex')
    const token =
      await this._tokenRepository.findByRefreshTokenHash(refreshTokenHash)

    if (!token || token.revoked || token.clientId !== client.id) {
      throw new OAuthError('invalid_grant', 'リフレッシュトークンが無効です')
    }
    if (token.isRefreshTokenExpired(getCurrentDate())) {
      throw new OAuthError(
        'invalid_grant',
        'リフレッシュトークンの有効期限が切れています'
      )
    }
    if (!(await this.isUsableUser(token.userId))) {
      throw new OAuthError('invalid_grant', 'ユーザーが無効です')
    }

    return this.rotateTokens(
      token.id,
      refreshTokenHash,
      client.id,
      token.userId,
      token.scopes
    )
  }

  /**
   * MCPサーバー（/api/mcp）用: アクセストークンを検証しuserId/scopesを返す
   *
   * @remarks
   * 無効な場合はnullを返す。トークン自体の失効・期限に加え、
   * 紐づくユーザーが退会・停止済み、またはゲストである場合も無効として扱う。
   */
  async verifyAccessToken(
    accessToken: string
  ): Promise<{ userId: string; scopes: ApiKeyScope[] } | null> {
    const hash = createHash('sha256').update(accessToken).digest('hex')
    const token = await this._tokenRepository.findByAccessTokenHash(hash)
    if (!token || token.revoked) return null
    if (token.isAccessTokenExpired(getCurrentDate())) return null
    if (!(await this.isUsableUser(token.userId))) return null
    return { userId: token.userId, scopes: token.scopes }
  }

  private verifyPkce(codeChallenge: string, codeVerifier: string): void {
    if (!codeVerifier) {
      throw new OAuthError('invalid_grant', 'code_verifier は必須です')
    }
    const hash = createHash('sha256').update(codeVerifier).digest('base64url')
    if (hash !== codeChallenge) {
      throw new OAuthError('invalid_grant', 'PKCE検証に失敗しました')
    }
  }

  private async issueTokens(
    clientId: string,
    userId: string,
    scopes: ApiKeyScope[]
  ): Promise<IssuedTokens> {
    const accessToken = `mcpat_${randomBytes(32).toString('base64url')}`
    const refreshToken = `mcprt_${randomBytes(32).toString('base64url')}`
    const accessTokenHash = createHash('sha256')
      .update(accessToken)
      .digest('hex')
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex')
    const now = getCurrentDate().getTime()

    await this._tokenRepository.create({
      accessTokenHash,
      refreshTokenHash,
      clientId,
      userId,
      scopes,
      accessTokenExpiresAt: new Date(now + ACCESS_TOKEN_TTL_MS),
      refreshTokenExpiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
    })

    return {
      accessToken,
      refreshToken,
      scopes,
      expiresIn: ACCESS_TOKEN_TTL_MS / 1000,
    }
  }

  private async rotateTokens(
    tokenRowId: string,
    expectedRefreshTokenHash: string,
    clientId: string,
    userId: string,
    scopes: ApiKeyScope[]
  ): Promise<IssuedTokens> {
    const accessToken = `mcpat_${randomBytes(32).toString('base64url')}`
    const refreshToken = `mcprt_${randomBytes(32).toString('base64url')}`
    const accessTokenHash = createHash('sha256')
      .update(accessToken)
      .digest('hex')
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex')
    const now = getCurrentDate().getTime()

    // 現在のrefreshTokenHashを条件にした原子的な更新。並行したリフレッシュ
    // リクエストによる後勝ちの上書き（片方のトークンの即時失効）を防ぐ。
    const rotated = await this._tokenRepository.rotate(
      tokenRowId,
      expectedRefreshTokenHash,
      {
        accessTokenHash,
        refreshTokenHash,
        accessTokenExpiresAt: new Date(now + ACCESS_TOKEN_TTL_MS),
        refreshTokenExpiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
      }
    )
    if (!rotated) {
      throw new OAuthError(
        'invalid_grant',
        'リフレッシュトークンは既に使用されています'
      )
    }

    return {
      accessToken,
      refreshToken,
      scopes,
      expiresIn: ACCESS_TOKEN_TTL_MS / 1000,
    }
  }
}
