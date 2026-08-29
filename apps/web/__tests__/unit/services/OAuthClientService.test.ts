import { createHash } from 'crypto'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { OAuthClientEntity } from '@/lib/api/server/entities/OAuthClientEntity'
import { OAuthError } from '@/lib/api/server/errors/OAuthError'
import { IOAuthClientRepository } from '@/lib/api/server/interfaces/IOAuthClientRepository'
import { OAuthClientService } from '@/lib/api/server/services/OAuthClientService'

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
    createdAt: new Date('2026-06-21T00:00:00Z'),
    updatedAt: new Date('2026-06-21T00:00:00Z'),
    ...overrides,
  })

const buildRepository = (): IOAuthClientRepository => ({
  findByClientId: vi.fn(),
  create: vi.fn(),
})

describe('OAuthClientService.registerClient()', () => {
  let repository: IOAuthClientRepository
  let service: OAuthClientService

  beforeEach(() => {
    repository = buildRepository()
    service = new OAuthClientService(repository)
  })

  test('redirectUris が空配列 → invalid_client_metadata エラー', async () => {
    await expect(
      service.registerClient({ redirectUris: [] })
    ).rejects.toMatchObject({ error: 'invalid_client_metadata' })
    await expect(
      service.registerClient({ redirectUris: [] })
    ).rejects.toBeInstanceOf(OAuthError)
  })

  test('不正なURL文字列を含む → invalid_client_metadata エラー', async () => {
    await expect(
      service.registerClient({ redirectUris: ['not-a-valid-url'] })
    ).rejects.toMatchObject({ error: 'invalid_client_metadata' })
  })

  test.each([
    'javascript:alert(1)',
    'data:text/html,x',
    'vbscript:x',
    'file:///etc/passwd',
  ])('実行可能スキーム(%s) → invalid_client_metadata エラー', async (uri) => {
    await expect(
      service.registerClient({ redirectUris: [uri] })
    ).rejects.toMatchObject({ error: 'invalid_client_metadata' })
  })

  test('フラグメントを含むredirect_uri → invalid_client_metadata エラー', async () => {
    await expect(
      service.registerClient({
        redirectUris: ['https://example.com/callback#fragment'],
      })
    ).rejects.toMatchObject({ error: 'invalid_client_metadata' })
  })

  test('正常系（tokenEndpointAuthMethod未指定） → clientSecretはnull、clientIdはmcpc_始まり', async () => {
    vi.mocked(repository.create).mockResolvedValue(buildClientEntity())

    const result = await service.registerClient({
      redirectUris: ['https://example.com/callback'],
    })

    expect(result.clientSecret).toBeNull()
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: expect.stringMatching(/^mcpc_/),
        tokenEndpointAuthMethod: 'NONE',
        clientSecretHash: null,
      })
    )
  })

  test('tokenEndpointAuthMethod: client_secret_basic → clientSecretは非null、clientSecretHashも非null', async () => {
    vi.mocked(repository.create).mockResolvedValue(
      buildClientEntity({ tokenEndpointAuthMethod: 'CLIENT_SECRET_BASIC' })
    )

    const result = await service.registerClient({
      redirectUris: ['https://example.com/callback'],
      tokenEndpointAuthMethod: 'client_secret_basic',
    })

    expect(result.clientSecret).not.toBeNull()
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenEndpointAuthMethod: 'CLIENT_SECRET_BASIC',
        clientSecretHash: expect.any(String),
      })
    )
  })
})

describe('OAuthClientService.getClientOrThrow()', () => {
  let repository: IOAuthClientRepository
  let service: OAuthClientService

  beforeEach(() => {
    repository = buildRepository()
    service = new OAuthClientService(repository)
  })

  test('リポジトリがnullを返す → invalid_client エラー', async () => {
    vi.mocked(repository.findByClientId).mockResolvedValue(null)

    await expect(service.getClientOrThrow('unknown')).rejects.toMatchObject({
      error: 'invalid_client',
    })
  })

  test('存在する場合はクライアントを返す', async () => {
    const client = buildClientEntity()
    vi.mocked(repository.findByClientId).mockResolvedValue(client)

    const result = await service.getClientOrThrow(client.clientId)

    expect(result).toBe(client)
  })
})

describe('OAuthClientService.verifyRedirectUri()', () => {
  let service: OAuthClientService

  beforeEach(() => {
    service = new OAuthClientService(buildRepository())
  })

  test('登録済みURIと不一致 → invalid_request エラー', () => {
    const client = buildClientEntity()

    expect(() =>
      service.verifyRedirectUri(client, 'https://evil.example.com/callback')
    ).toThrow(OAuthError)
    try {
      service.verifyRedirectUri(client, 'https://evil.example.com/callback')
    } catch (e) {
      expect((e as OAuthError).error).toBe('invalid_request')
    }
  })

  test('一致する場合は例外を投げない', () => {
    const client = buildClientEntity()

    expect(() =>
      service.verifyRedirectUri(client, 'https://example.com/callback')
    ).not.toThrow()
  })
})

describe('OAuthClientService.verifyClientSecret()', () => {
  let service: OAuthClientService

  beforeEach(() => {
    service = new OAuthClientService(buildRepository())
  })

  test('confidential clientでsecret未指定 → invalid_client エラー', () => {
    const client = buildClientEntity({
      tokenEndpointAuthMethod: 'CLIENT_SECRET_BASIC',
      clientSecretHash: createHash('sha256')
        .update('correct-secret')
        .digest('hex'),
    })

    expect(() => service.verifyClientSecret(client, undefined)).toThrow(
      OAuthError
    )
  })

  test('confidential clientで誤ったsecret → invalid_client エラー', () => {
    const client = buildClientEntity({
      tokenEndpointAuthMethod: 'CLIENT_SECRET_BASIC',
      clientSecretHash: createHash('sha256')
        .update('correct-secret')
        .digest('hex'),
    })

    expect(() => service.verifyClientSecret(client, 'wrong-secret')).toThrow(
      OAuthError
    )
  })

  test('confidential clientで正しいsecret → 例外なし', () => {
    const client = buildClientEntity({
      tokenEndpointAuthMethod: 'CLIENT_SECRET_BASIC',
      clientSecretHash: createHash('sha256')
        .update('correct-secret')
        .digest('hex'),
    })

    expect(() =>
      service.verifyClientSecret(client, 'correct-secret')
    ).not.toThrow()
  })

  test('public client（NONE）はsecret未指定でも例外なし', () => {
    const client = buildClientEntity({ tokenEndpointAuthMethod: 'NONE' })

    expect(() => service.verifyClientSecret(client, undefined)).not.toThrow()
  })
})
