import { createHash } from 'crypto'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  UserEntity,
  UserQuitEntity,
  ApiV1Error,
  IUserQuitRepository,
  IUserRepository,
} from '@repo/shared-domain'
import { createUserId, createUserQuitId } from '@repo/shared-types'
import { PrismaAuthProviderRepository } from '@/lib/api/server/repositories/PrismaAuthProviderRepository'
import { UserQuitService } from '@/lib/api/server/services/UserQuitService'

const buildUserEntity = (
  overrides: Partial<{
    role: 'USER' | 'ADMIN' | 'GUEST'
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  }> = {}
) =>
  new UserEntity(
    {
      id: createUserId('user-1'),
      name: 'Test User',
      role: overrides.role ?? 'USER',
      status: overrides.status ?? 'ACTIVE',
      notificationEmail: null,
      isProfilePublic: true,
    },
    'FREE'
  )

const buildUserQuitEntity = (
  overrides: Partial<{
    recoveryTokenHash: string
    purgeAt: Date
    status: 'QUIT' | 'RECOVERED'
  }> = {}
) =>
  new UserQuitEntity({
    id: createUserQuitId('quit-1'),
    userId: createUserId('user-1'),
    quitReason: 'テスト退会理由',
    quitAt: new Date('2026-01-01T00:00:00Z'),
    recoveryTokenHash: overrides.recoveryTokenHash ?? 'hash',
    purgeAt: overrides.purgeAt ?? new Date('2099-01-01T00:00:00Z'),
    status: overrides.status ?? 'QUIT',
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

const buildUserQuitRepository = (): IUserQuitRepository => ({
  create: vi.fn(),
  findByUserId: vi.fn(),
  findByRecoveryTokenHash: vi.fn(),
  updateStatus: vi.fn(),
  findPurgeTargets: vi.fn(),
})

describe('UserQuitService', () => {
  let userRepository: IUserRepository
  let authProviderRepository: PrismaAuthProviderRepository
  let userQuitRepository: IUserQuitRepository
  let service: UserQuitService

  beforeEach(() => {
    userRepository = buildUserRepository()
    authProviderRepository = {
      deactivateByUserId: vi.fn(),
      activateByUserId: vi.fn(),
    } as unknown as PrismaAuthProviderRepository
    userQuitRepository = buildUserQuitRepository()
    service = new UserQuitService(
      userRepository,
      authProviderRepository,
      userQuitRepository
    )
  })

  describe('quitUser()', () => {
    test('GUESTロールはFORBIDDENエラーとなる', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(
        buildUserEntity({ role: 'GUEST' })
      )

      await expect(
        service.quitUser({ userId: createUserId('user-1'), quitReason: '理由' })
      ).rejects.toThrow(ApiV1Error)
      expect(userQuitRepository.create).not.toHaveBeenCalled()
    })

    test('ADMINロールはFORBIDDENエラーとなる', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(
        buildUserEntity({ role: 'ADMIN' })
      )

      await expect(
        service.quitUser({ userId: createUserId('user-1'), quitReason: '理由' })
      ).rejects.toThrow(ApiV1Error)
      expect(userQuitRepository.create).not.toHaveBeenCalled()
    })

    test('USERロールは復帰トークンのSHA-256ハッシュを保存し、平文トークンを返す', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(
        buildUserEntity({ role: 'USER' })
      )
      vi.mocked(userQuitRepository.create).mockImplementation(async (e) => e)

      const result = await service.quitUser({
        userId: createUserId('user-1'),
        quitReason: '理由',
      })

      expect(result.recoveryToken).toEqual(expect.any(String))
      const createdEntity = vi.mocked(userQuitRepository.create).mock
        .calls[0]![0]
      expect(createdEntity.recoveryTokenHash).toBe(
        createHash('sha256').update(result.recoveryToken).digest('hex')
      )
      expect(userRepository.deactivateUser).toHaveBeenCalledWith('user-1')
      expect(authProviderRepository.deactivateByUserId).toHaveBeenCalledWith(
        'user-1'
      )
    })

    test('purgeAtはquitAtの30日後になる', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(
        buildUserEntity({ role: 'USER' })
      )
      vi.mocked(userQuitRepository.create).mockImplementation(async (e) => e)

      await service.quitUser({
        userId: createUserId('user-1'),
        quitReason: '理由',
      })

      const createdEntity = vi.mocked(userQuitRepository.create).mock
        .calls[0]![0]
      const diffMs =
        createdEntity.purgeAt.getTime() - createdEntity.quitAt.getTime()
      expect(diffMs).toBe(30 * 24 * 60 * 60 * 1000)
    })
  })

  describe('recoverUser()', () => {
    test('存在しないトークンはNOT_FOUNDエラーとなる', async () => {
      vi.mocked(userQuitRepository.findByRecoveryTokenHash).mockResolvedValue(
        null
      )

      await expect(
        service.recoverUser({ token: 'invalid-token' })
      ).rejects.toThrow(ApiV1Error)
    })

    test('既にRECOVERED済みの場合はINVALID_REQUESTエラーとなる', async () => {
      vi.mocked(userQuitRepository.findByRecoveryTokenHash).mockResolvedValue(
        buildUserQuitEntity({ status: 'RECOVERED' })
      )

      await expect(service.recoverUser({ token: 'token' })).rejects.toThrow(
        ApiV1Error
      )
      expect(userRepository.activateUser).not.toHaveBeenCalled()
    })

    test('猶予期間(purgeAt)を過ぎている場合はINVALID_REQUESTエラーとなる', async () => {
      vi.mocked(userQuitRepository.findByRecoveryTokenHash).mockResolvedValue(
        buildUserQuitEntity({ purgeAt: new Date('2000-01-01T00:00:00Z') })
      )

      await expect(service.recoverUser({ token: 'token' })).rejects.toThrow(
        ApiV1Error
      )
      expect(userRepository.activateUser).not.toHaveBeenCalled()
    })

    test('正常なトークンで復帰処理が行われ、RECOVEREDに更新される（ワンタイム化）', async () => {
      vi.mocked(userQuitRepository.findByRecoveryTokenHash).mockResolvedValue(
        buildUserQuitEntity()
      )
      vi.mocked(userRepository.findByIdIncludingInactive).mockResolvedValue(
        buildUserEntity({ status: 'INACTIVE' })
      )

      const result = await service.recoverUser({ token: 'token' })

      expect(result.userId).toBe('user-1')
      expect(userRepository.activateUser).toHaveBeenCalledWith('user-1')
      expect(authProviderRepository.activateByUserId).toHaveBeenCalledWith(
        'user-1'
      )
      expect(userQuitRepository.updateStatus).toHaveBeenCalledWith(
        'user-1',
        'RECOVERED'
      )
    })

    test('ユーザーがINACTIVE以外の状態の場合はINVALID_REQUESTエラーとなる', async () => {
      vi.mocked(userQuitRepository.findByRecoveryTokenHash).mockResolvedValue(
        buildUserQuitEntity()
      )
      vi.mocked(userRepository.findByIdIncludingInactive).mockResolvedValue(
        buildUserEntity({ status: 'ACTIVE' })
      )

      await expect(service.recoverUser({ token: 'token' })).rejects.toThrow(
        ApiV1Error
      )
      expect(userRepository.activateUser).not.toHaveBeenCalled()
    })
  })
})
