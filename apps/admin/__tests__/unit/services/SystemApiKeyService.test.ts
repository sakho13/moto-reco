import { createHash } from 'crypto'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { SystemApiKeyEntity } from '@/lib/api/server/entities/SystemApiKeyEntity'
import { ISystemApiKeyRepository } from '@/lib/api/server/interfaces/ISystemApiKeyRepository'
import { SystemApiKeyService } from '@/lib/api/server/services/SystemApiKeyService'

const buildSystemApiKeyEntity = (
  overrides: Partial<ConstructorParameters<typeof SystemApiKeyEntity>[0]> = {}
) =>
  new SystemApiKeyEntity({
    id: 'sk-1',
    name: 'test key',
    keyHash: 'hash',
    prefix: 'sk_abcd1234',
    isActive: true,
    lastUsedAt: null,
    createdAt: new Date('2026-07-01T00:00:00Z'),
    updatedAt: new Date('2026-07-01T00:00:00Z'),
    ...overrides,
  })

const buildRepository = (): ISystemApiKeyRepository => ({
  findAll: vi.fn(),
  findByKeyHash: vi.fn(),
  create: vi.fn(),
  updateIsActive: vi.fn(),
  touchLastUsedAt: vi.fn(),
})

describe('SystemApiKeyService', () => {
  let repository: ISystemApiKeyRepository
  let service: SystemApiKeyService

  beforeEach(() => {
    repository = buildRepository()
    service = new SystemApiKeyService(repository)
  })

  describe('generateApiKey()', () => {
    test('sk_ プレフィックスのfullKeyを生成し、ハッシュ化してリポジトリへ保存する', async () => {
      vi.mocked(repository.create).mockResolvedValue(buildSystemApiKeyEntity())

      const result = await service.generateApiKey({ name: 'my key' })

      expect(result.fullKey).toMatch(/^sk_[0-9a-f]+_/)
      expect(result.systemApiKey).toBeInstanceOf(SystemApiKeyEntity)

      const createArg = vi.mocked(repository.create).mock.calls[0]![0]
      expect(createArg.name).toBe('my key')
      expect(createArg.keyHash).toBe(
        createHash('sha256').update(result.fullKey).digest('hex')
      )
    })
  })

  describe('verifyApiKey()', () => {
    test('有効なキーは true を返し lastUsedAt を更新する', async () => {
      const entity = buildSystemApiKeyEntity({ id: 'sk-1', isActive: true })
      vi.mocked(repository.findByKeyHash).mockResolvedValue(entity)

      const result = await service.verifyApiKey('sk_abcd1234_secret')

      expect(result).toBe(true)
      expect(repository.touchLastUsedAt).toHaveBeenCalledWith(
        'sk-1',
        expect.any(Date)
      )
    })

    test('存在しないキーは false を返す', async () => {
      vi.mocked(repository.findByKeyHash).mockResolvedValue(null)

      const result = await service.verifyApiKey('sk_unknown_secret')

      expect(result).toBe(false)
      expect(repository.touchLastUsedAt).not.toHaveBeenCalled()
    })

    test('失効済み(isActive=false)のキーは false を返す', async () => {
      const entity = buildSystemApiKeyEntity({ isActive: false })
      vi.mocked(repository.findByKeyHash).mockResolvedValue(entity)

      const result = await service.verifyApiKey('sk_abcd1234_secret')

      expect(result).toBe(false)
      expect(repository.touchLastUsedAt).not.toHaveBeenCalled()
    })
  })

  describe('listApiKeys() / setActive()', () => {
    test('listApiKeysはリポジトリのfindAllを呼び出す', async () => {
      vi.mocked(repository.findAll).mockResolvedValue([
        buildSystemApiKeyEntity(),
      ])

      const result = await service.listApiKeys()

      expect(result).toHaveLength(1)
      expect(repository.findAll).toHaveBeenCalledTimes(1)
    })

    test('setActiveはリポジトリのupdateIsActiveを呼び出す', async () => {
      vi.mocked(repository.updateIsActive).mockResolvedValue(
        buildSystemApiKeyEntity({ isActive: false })
      )

      const result = await service.setActive('sk-1', false)

      expect(repository.updateIsActive).toHaveBeenCalledWith('sk-1', false)
      expect(result.isActive).toBe(false)
    })
  })
})
