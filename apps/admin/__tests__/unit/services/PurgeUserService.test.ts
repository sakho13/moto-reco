import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createUserId } from '@repo/shared-types'
import { IPurgeTargetRepository } from '@/lib/api/server/interfaces/IPurgeTargetRepository'
import {
  IPurgeUserRepository,
  PurgeTargetAuthProvider,
} from '@/lib/api/server/interfaces/IPurgeUserRepository'
import { PurgeUserService } from '@/lib/api/server/services/PurgeUserService'

const deleteUserFromFirebaseAuth = vi.fn()
const deleteStorageFile = vi.fn()

vi.mock('@repo/firebase-auth-server', () => ({
  getFirebaseAdminAuthClient: () => ({
    deleteUser: deleteUserFromFirebaseAuth,
  }),
  getFirebaseAdminStorage: () => ({
    bucket: () => ({
      file: () => ({
        delete: deleteStorageFile,
      }),
    }),
  }),
  getStorageBucketName: () => 'test-bucket',
}))

const buildPurgeTargetRepository = (): IPurgeTargetRepository => ({
  findPurgeTargets: vi.fn(),
})

const buildPurgeUserRepository = (): IPurgeUserRepository => ({
  findPhotoStoragePathsByUserId: vi.fn().mockResolvedValue([]),
  findAuthProvidersByUserId: vi.fn().mockResolvedValue([]),
  deletePlanHistoryAsChangedBy: vi.fn().mockResolvedValue(undefined),
  deleteUser: vi.fn().mockResolvedValue(undefined),
})

describe('PurgeUserService.purgeExpiredQuitUsers()', () => {
  let purgeTargetRepository: IPurgeTargetRepository
  let purgeUserRepository: IPurgeUserRepository
  let service: PurgeUserService

  beforeEach(() => {
    vi.clearAllMocks()
    deleteStorageFile.mockResolvedValue([{}])
    deleteUserFromFirebaseAuth.mockResolvedValue(undefined)
    purgeTargetRepository = buildPurgeTargetRepository()
    purgeUserRepository = buildPurgeUserRepository()
    service = new PurgeUserService(purgeTargetRepository, purgeUserRepository)
  })

  test('対象が0件の場合は成功・失敗ともに0件を返す', async () => {
    vi.mocked(purgeTargetRepository.findPurgeTargets).mockResolvedValue([])

    const result = await service.purgeExpiredQuitUsers(new Date())

    expect(result).toEqual({ succeededUserIds: [], failedUserIds: [] })
    expect(purgeUserRepository.deleteUser).not.toHaveBeenCalled()
  })

  test('対象ユーザーを Firebase Auth → Storage → プラン履歴 → DB の順で削除する', async () => {
    const userId = createUserId('user-1')
    vi.mocked(purgeTargetRepository.findPurgeTargets).mockResolvedValue([
      { userId },
    ])
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
    deleteUserFromFirebaseAuth.mockImplementation(async () => {
      callOrder.push('firebaseAuth')
    })
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

    const result = await service.purgeExpiredQuitUsers(new Date())

    expect(result.succeededUserIds).toEqual(['user-1'])
    expect(result.failedUserIds).toEqual([])
    expect(callOrder).toEqual([
      'firebaseAuth',
      'storage',
      'planHistory',
      'deleteUser',
    ])
    expect(deleteUserFromFirebaseAuth).toHaveBeenCalledWith('firebase-uid-1')
  })

  test('Firebase Auth削除が失敗した場合はDB削除に進まず、失敗として扱われる（次回バッチで再試行可能にする）', async () => {
    const userId = createUserId('user-fail')
    vi.mocked(purgeTargetRepository.findPurgeTargets).mockResolvedValue([
      { userId },
    ])
    vi.mocked(purgeUserRepository.findAuthProvidersByUserId).mockResolvedValue([
      { externalId: 'firebase-uid-1', providerType: 'FIREBASE_EMAIL' },
    ])
    deleteUserFromFirebaseAuth.mockRejectedValue(
      Object.assign(new Error('network error'), { code: 'auth/internal-error' })
    )

    const result = await service.purgeExpiredQuitUsers(new Date())

    expect(result.succeededUserIds).toEqual([])
    expect(result.failedUserIds).toEqual(['user-fail'])
    expect(purgeUserRepository.deleteUser).not.toHaveBeenCalled()
    expect(
      purgeUserRepository.deletePlanHistoryAsChangedBy
    ).not.toHaveBeenCalled()
  })

  test('Firebase Auth側で既に削除済み(auth/user-not-found)の場合は成功として扱いDB削除まで進める', async () => {
    const userId = createUserId('user-1')
    vi.mocked(purgeTargetRepository.findPurgeTargets).mockResolvedValue([
      { userId },
    ])
    vi.mocked(purgeUserRepository.findAuthProvidersByUserId).mockResolvedValue([
      { externalId: 'firebase-uid-1', providerType: 'FIREBASE_EMAIL' },
    ])
    deleteUserFromFirebaseAuth.mockRejectedValue(
      Object.assign(new Error('not found'), { code: 'auth/user-not-found' })
    )

    const result = await service.purgeExpiredQuitUsers(new Date())

    expect(result.succeededUserIds).toEqual(['user-1'])
    expect(result.failedUserIds).toEqual([])
    expect(purgeUserRepository.deleteUser).toHaveBeenCalledWith('user-1')
  })

  test('1件のDB削除失敗が他の対象ユーザーの処理を止めない', async () => {
    const failingUserId = createUserId('user-fail')
    const succeedingUserId = createUserId('user-ok')
    vi.mocked(purgeTargetRepository.findPurgeTargets).mockResolvedValue([
      { userId: failingUserId },
      { userId: succeedingUserId },
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
    const userId = createUserId('user-1')
    vi.mocked(purgeTargetRepository.findPurgeTargets).mockResolvedValue([
      { userId },
    ])
    vi.mocked(
      purgeUserRepository.findPhotoStoragePathsByUserId
    ).mockResolvedValue(['users/user-1/photos/a.jpg'])
    deleteStorageFile.mockRejectedValue(new Error('Storage削除に失敗しました'))

    const result = await service.purgeExpiredQuitUsers(new Date())

    expect(result.succeededUserIds).toEqual(['user-1'])
    expect(purgeUserRepository.deleteUser).toHaveBeenCalledWith('user-1')
  })

  test('Restrict FK対応: deleteUserの前にdeletePlanHistoryAsChangedByが呼ばれる', async () => {
    const userId = createUserId('user-1')
    vi.mocked(purgeTargetRepository.findPurgeTargets).mockResolvedValue([
      { userId },
    ])

    await service.purgeExpiredQuitUsers(new Date())

    expect(
      purgeUserRepository.deletePlanHistoryAsChangedBy
    ).toHaveBeenCalledWith('user-1')
    expect(purgeUserRepository.deleteUser).toHaveBeenCalledWith('user-1')
  })
})
