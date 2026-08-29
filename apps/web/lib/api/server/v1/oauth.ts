import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { SuccessResponse } from '@repo/shared-types'
import { ApiV1Error } from '../errors/ApiV1Error'
import { OAuthError } from '../errors/OAuthError'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateJson } from '../middlewares/zodValidation'
import { PrismaOAuthAuthorizationCodeRepository } from '../repositories/PrismaOAuthAuthorizationCodeRepository'
import { PrismaOAuthClientRepository } from '../repositories/PrismaOAuthClientRepository'
import { PrismaOAuthTokenRepository } from '../repositories/PrismaOAuthTokenRepository'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { OAuthAuthorizationService } from '../services/OAuthAuthorizationService'
import { OAuthClientService } from '../services/OAuthClientService'
import { HonoVariables } from '../types/hono'

/**
 * MCP OAuth 2.1 エンドポイント
 *
 * @remarks
 * `/register` と `/token` は外部OAuthクライアント（Claude.ai / ChatGPT等）が
 * 直接呼び出す標準OAuthエンドポイントのため、OAuth仕様準拠の生JSON形式
 * （`{error, error_description}` 形式のエラー含む）を返す。
 * アプリ内共通の `SuccessResponse` / `zodValidateJson`（`ApiV1Error`ベース）は使用しない。
 *
 * 一方 `/authorize` は自分自身のフロントエンド（同意画面ページ）だけが呼ぶ
 * 内部APIのため、`honoAuthMiddleware` + `zodValidateJson` + `SuccessResponse` という
 * 通常のアプリ内規約に従う。
 */
const oauth = new Hono<{ Variables: HonoVariables }>()

// ---- Dynamic Client Registration (RFC 7591) ----

const RegisterClientSchema = z.object({
  client_name: z.string().min(1).max(100).optional(),
  redirect_uris: z.array(z.string().min(1)).min(1),
  token_endpoint_auth_method: z
    .enum(['none', 'client_secret_basic'])
    .optional(),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
})

oauth.post('/register', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    throw new OAuthError(
      'invalid_client_metadata',
      'リクエストボディがJSONとして解析できません'
    )
  }

  const parsed = RegisterClientSchema.safeParse(body)
  if (!parsed.success) {
    throw new OAuthError(
      'invalid_client_metadata',
      parsed.error.issues.map((i) => i.message).join(', ')
    )
  }

  const service = new OAuthClientService(
    new PrismaOAuthClientRepository(prisma)
  )
  const { client, clientSecret } = await service.registerClient({
    clientName: parsed.data.client_name,
    redirectUris: parsed.data.redirect_uris,
    tokenEndpointAuthMethod: parsed.data.token_endpoint_auth_method,
  })

  return c.json(
    {
      client_id: client.clientId,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
      client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
      client_name: client.clientName,
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method:
        client.tokenEndpointAuthMethod === 'CLIENT_SECRET_BASIC'
          ? 'client_secret_basic'
          : 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    },
    201
  )
})

// ---- 認可コード発行（同意画面から呼ばれる内部API） ----

const AuthorizeRequestSchema = z.object({
  clientId: z.string().min(1),
  redirectUri: z.string().min(1),
  codeChallenge: z.string().min(1),
  codeChallengeMethod: z.string().min(1),
  state: z.string().optional(),
  scope: z.string().optional(),
  decision: z.enum(['approve', 'deny']),
})

oauth.post(
  '/authorize',
  honoAuthMiddleware,
  zodValidateJson(AuthorizeRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const body = c.req.valid('json')

    if (userEntity.role === 'GUEST') {
      throw new ApiV1Error('FORBIDDEN', 'ゲストアカウントはMCPを利用できません')
    }

    const clientRepository = new PrismaOAuthClientRepository(prisma)
    const clientService = new OAuthClientService(clientRepository)

    let client
    try {
      client = await clientService.getClientOrThrow(body.clientId)
      clientService.verifyRedirectUri(client, body.redirectUri)
    } catch (error) {
      if (error instanceof OAuthError) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }

    if (body.decision === 'deny') {
      const redirectUrl = new URL(body.redirectUri)
      redirectUrl.searchParams.set('error', 'access_denied')
      if (body.state) redirectUrl.searchParams.set('state', body.state)
      return c.json<SuccessResponse<{ redirectUrl: string }>>({
        status: 'success',
        data: { redirectUrl: redirectUrl.toString() },
        message: '認可を拒否しました',
      })
    }

    const service = new OAuthAuthorizationService(
      clientRepository,
      new PrismaOAuthAuthorizationCodeRepository(prisma),
      new PrismaOAuthTokenRepository(prisma),
      new PrismaUserRepository(prisma)
    )

    let code: string
    try {
      const result = await service.createAuthorizationCode({
        clientId: body.clientId,
        userId: String(userEntity.id),
        redirectUri: body.redirectUri,
        codeChallenge: body.codeChallenge,
        codeChallengeMethod: body.codeChallengeMethod,
        scope: body.scope,
      })
      code = result.code
    } catch (error) {
      if (error instanceof OAuthError) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }

    const redirectUrl = new URL(body.redirectUri)
    redirectUrl.searchParams.set('code', code)
    if (body.state) redirectUrl.searchParams.set('state', body.state)

    return c.json<SuccessResponse<{ redirectUrl: string }>>({
      status: 'success',
      data: { redirectUrl: redirectUrl.toString() },
      message: '認可コードを発行しました',
    })
  }
)

// ---- トークン交換（RFC 6749） ----

function parseBasicAuth(
  header: string | undefined
): { clientId: string; clientSecret: string } | null {
  if (!header?.startsWith('Basic ')) return null
  try {
    const decoded = Buffer.from(
      header.slice('Basic '.length),
      'base64'
    ).toString('utf-8')
    const idx = decoded.indexOf(':')
    if (idx === -1) return null
    return {
      clientId: decoded.slice(0, idx),
      clientSecret: decoded.slice(idx + 1),
    }
  } catch {
    return null
  }
}

oauth.post('/token', async (c) => {
  const contentType = c.req.header('Content-Type') ?? ''
  let raw: Record<string, unknown>
  if (contentType.includes('application/json')) {
    try {
      raw = (await c.req.json()) as Record<string, unknown>
    } catch {
      throw new OAuthError(
        'invalid_request',
        'リクエストボディの解析に失敗しました'
      )
    }
  } else {
    raw = await c.req.parseBody()
  }

  const grantType = String(raw['grant_type'] ?? '')
  const basicAuth = parseBasicAuth(c.req.header('Authorization'))
  const clientId = String(raw['client_id'] ?? basicAuth?.clientId ?? '')
  const clientSecret =
    (raw['client_secret'] as string | undefined) ?? basicAuth?.clientSecret

  if (!clientId) {
    throw new OAuthError('invalid_client', 'client_id は必須です')
  }

  const clientRepository = new PrismaOAuthClientRepository(prisma)
  const clientService = new OAuthClientService(clientRepository)
  const client = await clientService.getClientOrThrow(clientId)
  clientService.verifyClientSecret(client, clientSecret)

  const service = new OAuthAuthorizationService(
    clientRepository,
    new PrismaOAuthAuthorizationCodeRepository(prisma),
    new PrismaOAuthTokenRepository(prisma),
    new PrismaUserRepository(prisma)
  )

  let tokens
  if (grantType === 'authorization_code') {
    const code = String(raw['code'] ?? '')
    const codeVerifier = String(raw['code_verifier'] ?? '')
    const redirectUri = String(raw['redirect_uri'] ?? '')
    if (!code || !codeVerifier || !redirectUri) {
      throw new OAuthError(
        'invalid_request',
        'code, code_verifier, redirect_uri は必須です'
      )
    }
    tokens = await service.exchangeAuthorizationCode({
      code,
      codeVerifier,
      clientId,
      redirectUri,
    })
  } else if (grantType === 'refresh_token') {
    const refreshToken = String(raw['refresh_token'] ?? '')
    if (!refreshToken) {
      throw new OAuthError('invalid_request', 'refresh_token は必須です')
    }
    tokens = await service.refreshAccessToken({ refreshToken, clientId })
  } else {
    throw new OAuthError(
      'unsupported_grant_type',
      `サポートされていないgrant_typeです: ${grantType}`
    )
  }

  return c.json({
    access_token: tokens.accessToken,
    token_type: 'Bearer',
    expires_in: tokens.expiresIn,
    ...(tokens.refreshToken ? { refresh_token: tokens.refreshToken } : {}),
    scope: tokens.scopes.map((s) => s.toLowerCase()).join(' '),
  })
})

export default oauth
