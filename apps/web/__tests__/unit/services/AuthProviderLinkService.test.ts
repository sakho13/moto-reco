import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  AuthProviderEntity,
  ExternalIdUserStatus,
  IAuthProviderRepository,
} from '@repo/shared-domain'
import {
  FIREBASE_LINKABLE_PROVIDER_TYPES,
  ProviderType,
  createUserId,
} from '@repo/shared-types'
import { AuthProviderLinkService } from '@/lib/api/server/services/AuthProviderLinkService'

const buildAuthProvider = (providerType: ProviderType) =>
  new AuthProviderEntity({
    userId: createUserId('firebase-uid-1'),
    externalId: 'firebase-uid-1',
    providerType,
    isActive: true,
  })

const buildUserStatus = (
  overrides: Partial<ExternalIdUserStatus> = {}
): ExternalIdUserStatus => ({
  userId: createUserId('user-1'),
  status: 'ACTIVE',
  isQuit: false,
  ...overrides,
})

describe('AuthProviderLinkService', () => {
  let repository: IAuthProviderRepository
  let service: AuthProviderLinkService

  beforeEach(() => {
    repository = {
      findUserStatusByExternalId: vi.fn(),
      addProvider: vi.fn().mockResolvedValue(undefined),
    }
    service = new AuthProviderLinkService(repository)
  })

  test('同じ外部IDの有効なユーザーがいる場合は認証方式を追加してLINKEDを返す', async () => {
    vi.mocked(repository.findUserStatusByExternalId).mockResolvedValue(
      buildUserStatus()
    )

    const result = await service.linkByExternalId(
      buildAuthProvider('FIREBASE_GOOGLE')
    )

    expect(result).toEqual({ status: 'LINKED', userId: 'user-1' })
    expect(repository.findUserStatusByExternalId).toHaveBeenCalledWith(
      'firebase-uid-1',
      FIREBASE_LINKABLE_PROVIDER_TYPES
    )
    expect(repository.addProvider).toHaveBeenCalledWith(
      'user-1',
      'FIREBASE_GOOGLE',
      'firebase-uid-1'
    )
  })

  test('退会済みユーザーの場合は認証方式を追加せずQUITを返す', async () => {
    vi.mocked(repository.findUserStatusByExternalId).mockResolvedValue(
      buildUserStatus({ status: 'INACTIVE', isQuit: true })
    )

    const result = await service.linkByExternalId(
      buildAuthProvider('FIREBASE_GOOGLE')
    )

    expect(result).toEqual({ status: 'QUIT' })
    expect(repository.addProvider).not.toHaveBeenCalled()
  })

  test('有効でも退会済みでもないユーザーの場合は認証方式を追加せずNOT_FOUNDを返す', async () => {
    vi.mocked(repository.findUserStatusByExternalId).mockResolvedValue(
      buildUserStatus({ status: 'SUSPENDED' })
    )

    const result = await service.linkByExternalId(
      buildAuthProvider('FIREBASE_GOOGLE')
    )

    expect(result).toEqual({ status: 'NOT_FOUND' })
    expect(repository.addProvider).not.toHaveBeenCalled()
  })

  test('同じ外部IDのユーザーがいない場合はNOT_FOUNDを返す', async () => {
    vi.mocked(repository.findUserStatusByExternalId).mockResolvedValue(null)

    const result = await service.linkByExternalId(
      buildAuthProvider('FIREBASE_EMAIL')
    )

    expect(result).toEqual({ status: 'NOT_FOUND' })
    expect(repository.addProvider).not.toHaveBeenCalled()
  })

  test('匿名認証は紐付け対象外のため検索せずNOT_FOUNDを返す', async () => {
    const result = await service.linkByExternalId(
      buildAuthProvider('FIREBASE_ANONYMOUS')
    )

    expect(result).toEqual({ status: 'NOT_FOUND' })
    expect(repository.findUserStatusByExternalId).not.toHaveBeenCalled()
    expect(repository.addProvider).not.toHaveBeenCalled()
  })
})
