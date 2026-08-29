import { createHash } from 'crypto'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createUserId } from '@repo/shared-types'
import { OAuthAuthorizationCodeEntity } from '@/lib/api/server/entities/OAuthAuthorizationCodeEntity'
import { OAuthClientEntity } from '@/lib/api/server/entities/OAuthClientEntity'
import { OAuthTokenEntity } from '@/lib/api/server/entities/OAuthTokenEntity'
import { UserEntity } from '@/lib/api/server/entities/UserEntity'
import { IOAuthAuthorizationCodeRepository } from '@/lib/api/server/interfaces/IOAuthAuthorizationCodeRepository'
import { IOAuthClientRepository } from '@/lib/api/server/interfaces/IOAuthClientRepository'
import { IOAuthTokenRepository } from '@/lib/api/server/interfaces/IOAuthTokenRepository'
import { IUserRepository } from '@/lib/api/server/interfaces/IUserRepository'
import { OAuthAuthorizationService } from '@/lib/api/server/services/OAuthAuthorizationService'

const NOW = new Date('2026-08-29T00:00:00Z')

const buildClientEntity = (
  overrides: Partial<ConstructorParameters<typeof OAuthClientEntity>[0]> = {}
) =>
  new OAuthClientEntity({
    id: 'client-internal-1',
    clientId: 'mcpc_abc123',
    clientSecretHash: null,
    clientName: 'Test Client',
    redirectUris: ['https://example.com/callback'],
    tokenEndpointAuthMethod: 'NONE',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  })

const CODE_VERIFIER = 'test-code-verifier-0123456789abcdefghijklmnop'
const CODE_CHALLENGE = createHash('sha256')
  .update(CODE_VERIFIER)
  .digest('base64url')

const buildAuthCodeEntity = (
  overrides: Partial<
    ConstructorParameters<typeof OAuthAuthorizationCodeEntity>[0]
  > = {}
) =>
  new OAuthAuthorizationCodeEntity({
    id: 'auth-code-1',
    codeHash: 'code-hash',
    clientId: 'client-internal-1',
    userId: 'user-1',
    redirectUri: 'https://example.com/callback',
    codeChallenge: CODE_CHALLENGE,
    codeChallengeMethod: 'S256',
    scopes: ['READ'],
    used: false,
    expiresAt: new Date(NOW.getTime() + 10 * 60 * 1000),
    createdAt: NOW,
    ...overrides,
  })

const buildTokenEntity = (
  overrides: Partial<ConstructorParameters<typeof OAuthTokenEntity>[0]> = {}
) =>
  new OAuthTokenEntity({
    id: 'token-1',
    accessTokenHash: 'access-hash',
    refreshTokenHash: 'refresh-hash',
    clientId: 'client-internal-1',
    userId: 'user-1',
    scopes: ['READ'],
    revoked: false,
    accessTokenExpiresAt: new Date(NOW.getTime() + 60 * 60 * 1000),
    refreshTokenExpiresAt: new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000),
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  })

const buildUserEntity = (
  overrides: Partial<{
    id: string
    role: 'USER' | 'ADMIN' | 'GUEST'
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  }> = {}
) =>
  new UserEntity(
    {
      id: createUserId(overrides.id ?? 'user-1'),
      name: 'Test User',
      role: overrides.role ?? 'USER',
      status: overrides.status ?? 'ACTIVE',
      notificationEmail: null,
      isProfilePublic: false,
    },
    null
  )

const buildClientRepository = (): IOAuthClientRepository => ({
  findByClientId: vi.fn(),
  create: vi.fn(),
})

const buildCodeRepository = (): IOAuthAuthorizationCodeRepository => ({
  create: vi.fn(),
  findByCodeHash: vi.fn(),
  markUsed: vi.fn(),
})

const buildTokenRepository = (): IOAuthTokenRepository => ({
  create: vi.fn(),
  findByAccessTokenHash: vi.fn(),
  findByRefreshTokenHash: vi.fn(),
  rotate: vi.fn(),
})

const buildUserRepository = (): IUserRepository => ({
  findById: vi.fn(),
  findByIdIncludingInactive: vi.fn(),
  findByAuthProvider: vi.fn(),
  findByAuthProviderIncludingInactive: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deactivateUser: vi.fn(),
  activateUser: vi.fn(),
  createGuestUser: vi.fn(),
})

afterEach(() => {
  vi.useRealTimers()
})

describe('OAuthAuthorizationService.createAuthorizationCode()', () => {
  let clientRepository: IOAuthClientRepository
  let codeRepository: IOAuthAuthorizationCodeRepository
  let tokenRepository: IOAuthTokenRepository
  let userRepository: IUserRepository
  let service: OAuthAuthorizationService

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    clientRepository = buildClientRepository()
    codeRepository = buildCodeRepository()
    tokenRepository = buildTokenRepository()
    userRepository = buildUserRepository()
    service = new OAuthAuthorizationService(
      clientRepository,
      codeRepository,
      tokenRepository,
      userRepository
    )
  })

  test('クライアントが存在しない → invalid_client エラー', async () => {
    vi.mocked(clientRepository.findByClientId).mockResolvedValue(null)

    await expect(
      service.createAuthorizationCode({
        clientId: 'unknown',
        userId: 'user-1',
        redirectUri: 'https://example.com/callback',
        codeChallenge: CODE_CHALLENGE,
        codeChallengeMethod: 'S256',
      })
    ).rejects.toMatchObject({ error: 'invalid_client' })
  })

  test('redirect_uriが不一致 → invalid_request エラー', async () => {
    vi.mocked(clientRepository.findByClientId).mockResolvedValue(
      buildClientEntity()
    )

    await expect(
      service.createAuthorizationCode({
        clientId: 'mcpc_abc123',
        userId: 'user-1',
        redirectUri: 'https://evil.example.com/callback',
        codeChallenge: CODE_CHALLENGE,
        codeChallengeMethod: 'S256',
      })
    ).rejects.toMatchObject({ error: 'invalid_request' })
  })

  test('codeChallengeMethodがS256以外 → invalid_request エラー', async () => {
    vi.mocked(clientRepository.findByClientId).mockResolvedValue(
      buildClientEntity()
    )

    await expect(
      service.createAuthorizationCode({
        clientId: 'mcpc_abc123',
        userId: 'user-1',
        redirectUri: 'https://example.com/callback',
        codeChallenge: CODE_CHALLENGE,
        codeChallengeMethod: 'plain',
      })
    ).rejects.toMatchObject({ error: 'invalid_request' })
  })

  test('正常系 → codeが文字列で返り、codeRepository.createがclient.id（内部id）で呼ばれる', async () => {
    const client = buildClientEntity()
    vi.mocked(clientRepository.findByClientId).mockResolvedValue(client)
    vi.mocked(codeRepository.create).mockResolvedValue(buildAuthCodeEntity())

    const result = await service.createAuthorizationCode({
      clientId: client.clientId,
      userId: 'user-1',
      redirectUri: 'https://example.com/callback',
      codeChallenge: CODE_CHALLENGE,
      codeChallengeMethod: 'S256',
    })

    expect(typeof result.code).toBe('string')
    expect(codeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: client.id })
    )
  })
})

describe('OAuthAuthorizationService.exchangeAuthorizationCode()', () => {
  let clientRepository: IOAuthClientRepository
  let codeRepository: IOAuthAuthorizationCodeRepository
  let tokenRepository: IOAuthTokenRepository
  let userRepository: IUserRepository
  let service: OAuthAuthorizationService

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    clientRepository = buildClientRepository()
    codeRepository = buildCodeRepository()
    tokenRepository = buildTokenRepository()
    userRepository = buildUserRepository()
    service = new OAuthAuthorizationService(
      clientRepository,
      codeRepository,
      tokenRepository,
      userRepository
    )
    vi.mocked(clientRepository.findByClientId).mockResolvedValue(
      buildClientEntity()
    )
    vi.mocked(userRepository.findById).mockResolvedValue(buildUserEntity())
    vi.mocked(codeRepository.markUsed).mockResolvedValue(true)
  })

  const exchangeParams = {
    code: 'plain-code',
    codeVerifier: CODE_VERIFIER,
    clientId: 'mcpc_abc123',
    redirectUri: 'https://example.com/callback',
  }

  test('コードが見つからない → invalid_grant エラー', async () => {
    vi.mocked(codeRepository.findByCodeHash).mockResolvedValue(null)

    await expect(
      service.exchangeAuthorizationCode(exchangeParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  test('コードが使用済み → invalid_grant エラー', async () => {
    vi.mocked(codeRepository.findByCodeHash).mockResolvedValue(
      buildAuthCodeEntity({ used: true })
    )

    await expect(
      service.exchangeAuthorizationCode(exchangeParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  test('コードが有効期限切れ → invalid_grant エラー', async () => {
    vi.mocked(codeRepository.findByCodeHash).mockResolvedValue(
      buildAuthCodeEntity({ expiresAt: new Date(NOW.getTime() - 1000) })
    )

    await expect(
      service.exchangeAuthorizationCode(exchangeParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  test('redirect_uriが不一致 → invalid_grant エラー', async () => {
    vi.mocked(codeRepository.findByCodeHash).mockResolvedValue(
      buildAuthCodeEntity({ redirectUri: 'https://other.example.com/callback' })
    )

    await expect(
      service.exchangeAuthorizationCode(exchangeParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  test('PKCE検証失敗（code_verifierが不一致） → invalid_grant エラー', async () => {
    vi.mocked(codeRepository.findByCodeHash).mockResolvedValue(
      buildAuthCodeEntity()
    )

    await expect(
      service.exchangeAuthorizationCode({
        ...exchangeParams,
        codeVerifier: 'wrong-verifier',
      })
    ).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  test('ユーザーが退会済み（findByIdがnull） → invalid_grant エラー', async () => {
    vi.mocked(codeRepository.findByCodeHash).mockResolvedValue(
      buildAuthCodeEntity()
    )
    vi.mocked(userRepository.findById).mockResolvedValue(null)

    await expect(
      service.exchangeAuthorizationCode(exchangeParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
    expect(codeRepository.markUsed).not.toHaveBeenCalled()
  })

  test('ユーザーがゲスト → invalid_grant エラー', async () => {
    vi.mocked(codeRepository.findByCodeHash).mockResolvedValue(
      buildAuthCodeEntity()
    )
    vi.mocked(userRepository.findById).mockResolvedValue(
      buildUserEntity({ role: 'GUEST' })
    )

    await expect(
      service.exchangeAuthorizationCode(exchangeParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  test('認可コードが並行して既に消費されていた（markUsedがfalse） → invalid_grant エラー', async () => {
    vi.mocked(codeRepository.findByCodeHash).mockResolvedValue(
      buildAuthCodeEntity()
    )
    vi.mocked(codeRepository.markUsed).mockResolvedValue(false)

    await expect(
      service.exchangeAuthorizationCode(exchangeParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
    expect(tokenRepository.create).not.toHaveBeenCalled()
  })

  test('正常系 → accessToken/refreshTokenが返り、markUsedとtokenRepository.createが呼ばれる', async () => {
    vi.mocked(codeRepository.findByCodeHash).mockResolvedValue(
      buildAuthCodeEntity()
    )
    vi.mocked(tokenRepository.create).mockResolvedValue(buildTokenEntity())

    const result = await service.exchangeAuthorizationCode(exchangeParams)

    expect(result.accessToken).toEqual(expect.stringMatching(/^mcpat_/))
    expect(result.refreshToken).toEqual(expect.stringMatching(/^mcprt_/))
    expect(codeRepository.markUsed).toHaveBeenCalledWith('auth-code-1')
    expect(tokenRepository.create).toHaveBeenCalled()
  })
})

describe('OAuthAuthorizationService.refreshAccessToken()', () => {
  let clientRepository: IOAuthClientRepository
  let codeRepository: IOAuthAuthorizationCodeRepository
  let tokenRepository: IOAuthTokenRepository
  let userRepository: IUserRepository
  let service: OAuthAuthorizationService

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    clientRepository = buildClientRepository()
    codeRepository = buildCodeRepository()
    tokenRepository = buildTokenRepository()
    userRepository = buildUserRepository()
    service = new OAuthAuthorizationService(
      clientRepository,
      codeRepository,
      tokenRepository,
      userRepository
    )
    vi.mocked(clientRepository.findByClientId).mockResolvedValue(
      buildClientEntity()
    )
    vi.mocked(userRepository.findById).mockResolvedValue(buildUserEntity())
  })

  const refreshParams = {
    refreshToken: 'plain-refresh-token',
    clientId: 'mcpc_abc123',
  }

  test('トークンが見つからない → invalid_grant エラー', async () => {
    vi.mocked(tokenRepository.findByRefreshTokenHash).mockResolvedValue(null)

    await expect(
      service.refreshAccessToken(refreshParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  test('トークンがrevoked → invalid_grant エラー', async () => {
    vi.mocked(tokenRepository.findByRefreshTokenHash).mockResolvedValue(
      buildTokenEntity({ revoked: true })
    )

    await expect(
      service.refreshAccessToken(refreshParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  test('リフレッシュトークンの有効期限切れ → invalid_grant エラー', async () => {
    vi.mocked(tokenRepository.findByRefreshTokenHash).mockResolvedValue(
      buildTokenEntity({
        refreshTokenExpiresAt: new Date(NOW.getTime() - 1000),
      })
    )

    await expect(
      service.refreshAccessToken(refreshParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  test('ユーザーが退会済み（findByIdがnull） → invalid_grant エラー', async () => {
    vi.mocked(tokenRepository.findByRefreshTokenHash).mockResolvedValue(
      buildTokenEntity()
    )
    vi.mocked(userRepository.findById).mockResolvedValue(null)

    await expect(
      service.refreshAccessToken(refreshParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
    expect(tokenRepository.rotate).not.toHaveBeenCalled()
  })

  test('ユーザーがゲスト → invalid_grant エラー', async () => {
    vi.mocked(tokenRepository.findByRefreshTokenHash).mockResolvedValue(
      buildTokenEntity()
    )
    vi.mocked(userRepository.findById).mockResolvedValue(
      buildUserEntity({ role: 'GUEST' })
    )

    await expect(
      service.refreshAccessToken(refreshParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  test('並行リクエストで既にローテーション済み（rotateがnull） → invalid_grant エラー', async () => {
    vi.mocked(tokenRepository.findByRefreshTokenHash).mockResolvedValue(
      buildTokenEntity()
    )
    vi.mocked(tokenRepository.rotate).mockResolvedValue(null)

    await expect(
      service.refreshAccessToken(refreshParams)
    ).rejects.toMatchObject({ error: 'invalid_grant' })
  })

  test('正常系 → tokenRepository.rotateが現在のrefreshTokenHashを条件に呼ばれ、新しいトークンが返る', async () => {
    vi.mocked(tokenRepository.findByRefreshTokenHash).mockResolvedValue(
      buildTokenEntity()
    )
    vi.mocked(tokenRepository.rotate).mockResolvedValue(
      buildTokenEntity({ id: 'token-2' })
    )

    const result = await service.refreshAccessToken(refreshParams)

    expect(tokenRepository.rotate).toHaveBeenCalledWith(
      'token-1',
      createHash('sha256').update(refreshParams.refreshToken).digest('hex'),
      expect.objectContaining({
        accessTokenHash: expect.any(String),
        refreshTokenHash: expect.any(String),
      })
    )
    expect(result.accessToken).toEqual(expect.stringMatching(/^mcpat_/))
    expect(result.refreshToken).toEqual(expect.stringMatching(/^mcprt_/))
  })
})

describe('OAuthAuthorizationService.verifyAccessToken()', () => {
  let tokenRepository: IOAuthTokenRepository
  let userRepository: IUserRepository
  let service: OAuthAuthorizationService

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    tokenRepository = buildTokenRepository()
    userRepository = buildUserRepository()
    service = new OAuthAuthorizationService(
      buildClientRepository(),
      buildCodeRepository(),
      tokenRepository,
      userRepository
    )
    vi.mocked(userRepository.findById).mockResolvedValue(buildUserEntity())
  })

  test('トークンが見つからない → null', async () => {
    vi.mocked(tokenRepository.findByAccessTokenHash).mockResolvedValue(null)

    await expect(service.verifyAccessToken('token')).resolves.toBeNull()
  })

  test('トークンがrevoked → null', async () => {
    vi.mocked(tokenRepository.findByAccessTokenHash).mockResolvedValue(
      buildTokenEntity({ revoked: true })
    )

    await expect(service.verifyAccessToken('token')).resolves.toBeNull()
  })

  test('トークンの有効期限切れ → null', async () => {
    vi.mocked(tokenRepository.findByAccessTokenHash).mockResolvedValue(
      buildTokenEntity({
        accessTokenExpiresAt: new Date(NOW.getTime() - 1000),
      })
    )

    await expect(service.verifyAccessToken('token')).resolves.toBeNull()
  })

  test('ユーザーが退会済み（findByIdがnull） → null', async () => {
    vi.mocked(tokenRepository.findByAccessTokenHash).mockResolvedValue(
      buildTokenEntity()
    )
    vi.mocked(userRepository.findById).mockResolvedValue(null)

    await expect(service.verifyAccessToken('token')).resolves.toBeNull()
  })

  test('ユーザーがゲスト → null', async () => {
    vi.mocked(tokenRepository.findByAccessTokenHash).mockResolvedValue(
      buildTokenEntity()
    )
    vi.mocked(userRepository.findById).mockResolvedValue(
      buildUserEntity({ role: 'GUEST' })
    )

    await expect(service.verifyAccessToken('token')).resolves.toBeNull()
  })

  test('正常系 → {userId, scopes}が返る', async () => {
    vi.mocked(tokenRepository.findByAccessTokenHash).mockResolvedValue(
      buildTokenEntity({ userId: 'user-42', scopes: ['READ', 'WRITE'] })
    )

    await expect(service.verifyAccessToken('token')).resolves.toEqual({
      userId: 'user-42',
      scopes: ['READ', 'WRITE'],
    })
  })
})
