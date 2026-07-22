import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createUserId, createUserQuitId } from '@repo/shared-types'
import { UserQuitEntity } from '@/lib/api/server/entities/UserQuitEntity'
import {
  IPurgeUserRepository,
  PurgeTargetAuthProvider,
} from '@/lib/api/server/interfaces/IPurgeUserRepository'
import { IUserQuitRepository } from '@/lib/api/server/interfaces/IUserQuitRepository'
import { PurgeUserService } from '@/lib/api/server/services/PurgeUserService'

const deleteUserFromFirebaseAuth = vi.fn()
const deleteStorageFile = vi.fn()

vi.mock('@/lib/firebase/adminStorage', () => ({
  getFirebaseAdminStorage: () => ({
    bucket: () => ({
      file: () => ({
        delete: deleteStorageFile,
      }),
    }),
  }),
  getStorageBucketName: () => 'test-bucket',
}))

vi.mock('@repo/firebase-auth-server', () => ({
  getFirebaseAdminAuthClient: () => ({
    deleteUser: deleteUserFromFirebaseAuth,
  }),
}))

const buildUserQuitEntity = (
  overrides: Partial<{ userId: string; purgeAt: Date }> = {}
) =>
  new UserQuitEntity({
    id: createUserQuitId('quit-1'),
    userId: createUserId(overrides.userId ?? 'user-1'),
    quitReason: 'テスト退会理由',
    quitAt: new Date('2026-01-01T00:00:00Z'),
    recoveryTokenHash: 'hash',
    purgeAt: overrides.purgeAt ?? new Date('2026-01-31T00:00:00Z'),
    status: 'QUIT',
  })

const buildUserQuitRepository = (): IUserQuitRepository => ({
  create: vi.fn(),
  findByUserId: vi.fn(),
  findByRecoveryTokenHash: vi.fn(),
  updateStatus: vi.fn(),
  findPurgeTargets: vi.fn(),
})

const buildPurgeUserRepository = (): IPurgeUserRepository => ({
  findPhotoStoragePathsByUserId: vi.fn().mockResolvedValue([]),
  findAuthProvidersByUserId: vi.fn().mockResolvedValue([]),
  deletePlanHistoryAsChangedBy: vi.fn().mockResolvedValue(undefined),
  deleteUser: vi.fn().mockResolvedValue(undefined),
})

describe('PurgeUserService.purgeExpiredQuitUsers()', () => {
  let userQuitRepository: IUserQuitRepository
  let purgeUserRepository: IPurgeUserRepository
  let service: PurgeUserService

  beforeEach(() => {
    vi.clearAllMocks()
    deleteStorageFile.mockResolvedValue([{}])
    deleteUserFromFirebaseAuth.mockResolvedValue(undefined)
    userQuitRepository = buildUserQuitRepository()
    purgeUserRepository = buildPurgeUserRepository()
    service = new PurgeUserService(userQuitRepository, purgeUserRepository)
  })

  test('対象が0件の場合は成功・失敗ともに0件を返す', async () => {
    vi.mocked(userQuitRepository.findPurgeTargets).mockResolvedValue([])

    const result = await service.purgeExpiredQuitUsers(new Date())

    expect(result).toEqual({ succeededUserIds: [], failedUserIds: [] })
    expect(purgeUserRepository.deleteUser).not.toHaveBeenCalled()
  })

  test('対象ユーザーを Storage → プラン履歴 → DB → Firebase Auth の順で削除する', async () => {
    const target = buildUserQuitEntity({ userId: 'user-1' })
    vi.mocked(userQuitRepository.findPurgeTargets).mockResolvedValue([target])
    vi.mocked(
      purgeUserRepository.findPhotoStoragePathsByUserId
    ).mockResolvedValue(['users/user-1/photos/a.jpg'])
    const authProviders: PurgeTargetAuthProvider[] = [
      { externalId: 'firebase-uid-1', providerType: 'FIREBASE_EMAIL' },
    ]
    vi.mocked(purgeUserRepository.findAuthProvidersByUserId).mockResolvedValue(
      authProviders
    )

    const callOrder: string[] = []
    deleteStorageFile.mockImplementation(async () => {
      callOrder.push('storage')
      return [{}]
    })
    vi.mocked(
      purgeUserRepository.deletePlanHistoryAsChangedBy
    ).mockImplementation(async () => {
      callOrder.push('planHistory')
    })
    vi.mocked(purgeUserRepository.deleteUser).mockImplementation(async () => {
      callOrder.push('deleteUser')
    })
    deleteUserFromFirebaseAuth.mockImplementation(async () => {
      callOrder.push('firebaseAuth')
    })

    const result = await service.purgeExpiredQuitUsers(new Date())

    expect(result.succeededUserIds).toEqual(['user-1'])
    expect(result.failedUserIds).toEqual([])
    expect(callOrder).toEqual([
      'storage',
      'planHistory',
      'deleteUser',
      'firebaseAuth',
    ])
    expect(deleteUserFromFirebaseAuth).toHaveBeenCalledWith('firebase-uid-1')
  })

  test('1件のDB削除失敗が他の対象ユーザーの処理を止めない', async () => {
    const failingTarget = buildUserQuitEntity({ userId: 'user-fail' })
    const succeedingTarget = buildUserQuitEntity({ userId: 'user-ok' })
    vi.mocked(userQuitRepository.findPurgeTargets).mockResolvedValue([
      failingTarget,
      succeedingTarget,
    ])
    vi.mocked(purgeUserRepository.deleteUser).mockImplementation(
      async (userId) => {
        if (userId === 'user-fail') {
          throw new Error('DB削除に失敗しました')
        }
      }
    )

    const result = await service.purgeExpiredQuitUsers(new Date())

    expect(result.succeededUserIds).toEqual(['user-ok'])
    expect(result.failedUserIds).toEqual(['user-fail'])
  })

  test('Storageファイル削除が個別に失敗してもDB削除は継続される', async () => {
    const target = buildUserQuitEntity({ userId: 'user-1' })
    vi.mocked(userQuitRepository.findPurgeTargets).mockResolvedValue([target])
    vi.mocked(
      purgeUserRepository.findPhotoStoragePathsByUserId
    ).mockResolvedValue(['users/user-1/photos/a.jpg'])
    deleteStorageFile.mockRejectedValue(new Error('Storage削除に失敗しました'))

    const result = await service.purgeExpiredQuitUsers(new Date())

    expect(result.succeededUserIds).toEqual(['user-1'])
    expect(purgeUserRepository.deleteUser).toHaveBeenCalledWith('user-1')
  })

  test('Restrict FK対応: deleteUserの前にdeletePlanHistoryAsChangedByが呼ばれる', async () => {
    const target = buildUserQuitEntity({ userId: 'user-1' })
    vi.mocked(userQuitRepository.findPurgeTargets).mockResolvedValue([target])

    await service.purgeExpiredQuitUsers(new Date())

    expect(
      purgeUserRepository.deletePlanHistoryAsChangedBy
    ).toHaveBeenCalledWith('user-1')
    expect(purgeUserRepository.deleteUser).toHaveBeenCalledWith('user-1')
  })
})
