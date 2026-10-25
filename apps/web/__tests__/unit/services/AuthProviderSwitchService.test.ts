import { describe, expect, test, vi } from 'vitest'
import {
  ApiV1Error,
  IAuthProviderRepository,
  IFirebaseAccountRepository,
  UserEntity,
} from '@repo/shared-domain'
import { createUserId, type ProviderType } from '@repo/shared-types'
import { AuthProviderSwitchService } from '@/lib/api/server/services/AuthProviderSwitchService'

const EXTERNAL_ID = 'firebase-uid'

const createUser = (role: 'USER' | 'GUEST' = 'USER') =>
  new UserEntity(
    {
      id: createUserId('user-1'),
      name: 'テストユーザー',
      role,
      status: 'ACTIVE',
      notificationEmail: null,
      isProfilePublic: true,
    },
    null
  )

const setup = (
  linkedProviderTypes: ProviderType[],
  currentProviderType: ProviderType | null
) => {
  const authProviderRepository = {
    findProviderTypeByUserId: vi.fn().mockResolvedValue(currentProviderType),
    updateProviderType: vi.fn().mockResolvedValue(undefined),
  } satisfies IAuthProviderRepository
  const firebaseAccountRepository = {
    findLinkedProviderTypes: vi.fn().mockResolvedValue(linkedProviderTypes),
    unlinkProviders: vi.fn().mockResolvedValue(undefined),
    restoreEmailFromProvider: vi.fn().mockResolvedValue(undefined),
  } satisfies IFirebaseAccountRepository
  const service = new AuthProviderSwitchService(
    authProviderRepository,
    firebaseAccountRepository
  )
  return { service, authProviderRepository, firebaseAccountRepository }
}

describe('AuthProviderSwitchService', () => {
  test('切り替え先以外の認証方式をFirebaseから外し、DBの認証方式を更新する', async () => {
    const { service, authProviderRepository, firebaseAccountRepository } =
      setup(['FIREBASE_EMAIL', 'FIREBASE_GOOGLE'], 'FIREBASE_EMAIL')

    const result = await service.switchProvider(
      createUser(),
      EXTERNAL_ID,
      'FIREBASE_GOOGLE'
    )

    expect(result).toEqual({ providerType: 'FIREBASE_GOOGLE', switched: true })
    expect(firebaseAccountRepository.unlinkProviders).toHaveBeenCalledWith(
      EXTERNAL_ID,
      ['FIREBASE_EMAIL']
    )
    expect(authProviderRepository.updateProviderType).toHaveBeenCalledWith(
      'user-1',
      'FIREBASE_GOOGLE'
    )
    expect(
      firebaseAccountRepository.restoreEmailFromProvider
    ).toHaveBeenCalledWith(EXTERNAL_ID, 'FIREBASE_GOOGLE')
  })

  test('DBの認証方式が既に切り替え先と同じ場合は更新せずswitched: falseを返す', async () => {
    const { service, authProviderRepository, firebaseAccountRepository } =
      setup(['FIREBASE_GOOGLE'], 'FIREBASE_GOOGLE')

    const result = await service.switchProvider(
      createUser(),
      EXTERNAL_ID,
      'FIREBASE_GOOGLE'
    )

    expect(result).toEqual({
      providerType: 'FIREBASE_GOOGLE',
      switched: false,
    })
    expect(firebaseAccountRepository.unlinkProviders).not.toHaveBeenCalled()
    expect(authProviderRepository.updateProviderType).not.toHaveBeenCalled()
  })

  test('DBの認証方式が同じでもFirebaseに別の認証方式が残っていれば外す', async () => {
    const { service, authProviderRepository, firebaseAccountRepository } =
      setup(['FIREBASE_EMAIL', 'FIREBASE_GOOGLE'], 'FIREBASE_EMAIL')

    const result = await service.switchProvider(
      createUser(),
      EXTERNAL_ID,
      'FIREBASE_EMAIL'
    )

    expect(result).toEqual({ providerType: 'FIREBASE_EMAIL', switched: false })
    expect(firebaseAccountRepository.unlinkProviders).toHaveBeenCalledWith(
      EXTERNAL_ID,
      ['FIREBASE_GOOGLE']
    )
    expect(authProviderRepository.updateProviderType).not.toHaveBeenCalled()
    expect(
      firebaseAccountRepository.restoreEmailFromProvider
    ).not.toHaveBeenCalled()
  })

  test('切り替え先がFirebaseに紐付いていない場合はINVALID_REQUESTとなり、何も変更しない', async () => {
    const { service, authProviderRepository, firebaseAccountRepository } =
      setup(['FIREBASE_EMAIL'], 'FIREBASE_EMAIL')

    await expect(
      service.switchProvider(createUser(), EXTERNAL_ID, 'FIREBASE_GOOGLE')
    ).rejects.toMatchObject({
      errorCode: 'INVALID_REQUEST',
      message: '切り替え先の認証方式が紐付いていません',
    })
    expect(firebaseAccountRepository.unlinkProviders).not.toHaveBeenCalled()
    expect(authProviderRepository.updateProviderType).not.toHaveBeenCalled()
  })

  test('ゲストユーザーはINVALID_REQUESTとなる', async () => {
    const { service, firebaseAccountRepository } = setup(
      ['FIREBASE_GOOGLE'],
      'FIREBASE_ANONYMOUS'
    )

    await expect(
      service.switchProvider(
        createUser('GUEST'),
        EXTERNAL_ID,
        'FIREBASE_GOOGLE'
      )
    ).rejects.toBeInstanceOf(ApiV1Error)
    expect(
      firebaseAccountRepository.findLinkedProviderTypes
    ).not.toHaveBeenCalled()
  })

  test('切り替え可能でない認証方式はINVALID_REQUESTとなる', async () => {
    const { service } = setup(['FIREBASE_EMAIL'], 'FIREBASE_EMAIL')

    await expect(
      service.switchProvider(createUser(), EXTERNAL_ID, 'FIREBASE_ANONYMOUS')
    ).rejects.toMatchObject({ errorCode: 'INVALID_REQUEST' })
  })
})
