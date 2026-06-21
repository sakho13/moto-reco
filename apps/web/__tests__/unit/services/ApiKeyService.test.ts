import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createUserId } from '@repo/shared-types'
import { ApiKeyEntity } from '@/lib/api/server/entities/ApiKeyEntity'
import { UserEntity } from '@/lib/api/server/entities/UserEntity'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { IApiKeyRepository } from '@/lib/api/server/interfaces/IApiKeyRepository'
import { ApiKeyService } from '@/lib/api/server/services/ApiKeyService'

const buildUserEntity = (
  overrides: Partial<{
    role: 'USER' | 'ADMIN' | 'GUEST'
    plan: 'FREE' | 'PREMIUM' | 'UNLIMITED'
  }> = {}
) =>
  new UserEntity({
    id: createUserId('user-1'),
    name: 'Test User',
    role: overrides.role ?? 'USER',
    status: 'ACTIVE',
    plan: overrides.plan === 'UNLIMITED' ? 'FREE' : (overrides.plan ?? 'FREE'),
    notificationEmail: null,
    isProfilePublic: true,
  })

const buildApiKeyEntity = (
  overrides: Partial<ConstructorParameters<typeof ApiKeyEntity>[0]> = {}
) =>
  new ApiKeyEntity({
    id: 'key-1',
    userId: 'user-1',
    name: 'test key',
    keyHash: 'hash',
    prefix: 'mk_abcd1234',
    isActive: true,
    createdAt: new Date('2026-06-21T00:00:00Z'),
    updatedAt: new Date('2026-06-21T00:00:00Z'),
    ...overrides,
  })

const buildRepository = (): IApiKeyRepository => ({
  findByUserId: vi.fn(),
  findByKeyHash: vi.fn(),
  countActiveByUserId: vi.fn(),
  create: vi.fn(),
  revoke: vi.fn(),
  delete: vi.fn(),
})

describe('ApiKeyService.generateApiKey()', () => {
  let repository: IApiKeyRepository
  let service: ApiKeyService

  beforeEach(() => {
    repository = buildRepository()
    service = new ApiKeyService(repository)
  })

  test('GUEST は plan に関わらず FORBIDDEN エラー', async () => {
    await expect(
      service.generateApiKey({
        user: buildUserEntity({ role: 'GUEST' }),
        name: 'key',
      })
    ).rejects.toThrow(
      new ApiV1Error('FORBIDDEN', 'ゲストアカウントはAPIキーを発行できません')
    )
  })

  test('USER + FREE + 既存0件 → 成功', async () => {
    vi.mocked(repository.countActiveByUserId).mockResolvedValue(0)
    vi.mocked(repository.create).mockResolvedValue(buildApiKeyEntity())

    const result = await service.generateApiKey({
      user: buildUserEntity({ role: 'USER', plan: 'FREE' }),
      name: 'key',
    })

    expect(result.apiKey).toBeInstanceOf(ApiKeyEntity)
    expect(result.fullKey).toMatch(/^mk_/)
  })

  test('USER + FREE + 既存1件 → INVALID_REQUEST エラー', async () => {
    vi.mocked(repository.countActiveByUserId).mockResolvedValue(1)

    await expect(
      service.generateApiKey({
        user: buildUserEntity({ role: 'USER', plan: 'FREE' }),
        name: 'key',
      })
    ).rejects.toThrow(ApiV1Error)
  })

  test('USER + PREMIUM + 既存多数件 → 成功（無制限）', async () => {
    vi.mocked(repository.create).mockResolvedValue(buildApiKeyEntity())

    const result = await service.generateApiKey({
      user: buildUserEntity({ role: 'USER', plan: 'PREMIUM' }),
      name: 'key',
    })

    expect(result.apiKey).toBeInstanceOf(ApiKeyEntity)
    expect(repository.countActiveByUserId).not.toHaveBeenCalled()
  })

  test('ADMIN (UNLIMITED) → 成功（プラン制限なし）', async () => {
    vi.mocked(repository.create).mockResolvedValue(buildApiKeyEntity())

    const result = await service.generateApiKey({
      user: buildUserEntity({ role: 'ADMIN' }),
      name: 'key',
    })

    expect(result.apiKey).toBeInstanceOf(ApiKeyEntity)
    expect(repository.countActiveByUserId).not.toHaveBeenCalled()
  })

  test('成功時: fullKey は mk_ プレフィックスを持ち、apiKey エンティティを返す', async () => {
    vi.mocked(repository.countActiveByUserId).mockResolvedValue(0)
    vi.mocked(repository.create).mockResolvedValue(
      buildApiKeyEntity({ name: 'my key' })
    )

    const result = await service.generateApiKey({
      user: buildUserEntity({ role: 'USER', plan: 'FREE' }),
      name: 'my key',
    })

    expect(result.fullKey).toMatch(/^mk_[0-9a-f]+_/)
    expect(result.apiKey.name).toBe('my key')
  })
})
