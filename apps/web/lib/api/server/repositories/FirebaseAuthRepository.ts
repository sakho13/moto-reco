import type { DecodedIdToken } from 'firebase-admin/auth'
import { getFirebaseAdminAuthClient } from '@repo/firebase-auth-server'
import {
  AuthProviderEntity,
  IAuthRepository,
  IFirebaseAccountRepository,
} from '@repo/shared-domain'
import {
  AuthProvider,
  ProviderTypeMap,
  type ProviderType,
} from '@repo/shared-types'
import { createUserId } from '@repo/shared-types'

/** 切り替え可能な認証方式と Firebase のプロバイダIDの対応 */
const FIREBASE_PROVIDER_IDS: Partial<Record<ProviderType, string>> = {
  [ProviderTypeMap.FIREBASE_EMAIL]: 'password',
  [ProviderTypeMap.FIREBASE_GOOGLE]: 'google.com',
}

export class FirebaseAuthRepository
  implements IAuthRepository, IFirebaseAccountRepository
{
  async authorize(token: string): Promise<AuthProviderEntity | null> {
    try {
      const decodedToken = await this.verifyIdToken(token)

      if (!decodedToken) {
        return null
      }

      // Firebase UIDからAuthProviderを構築
      const authProvider: AuthProvider = {
        userId: createUserId(decodedToken.uid),
        externalId: decodedToken.uid,
        providerType: this.getProviderType(decodedToken),
        isActive: true,
        metadata: {
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          firebaseProvider: decodedToken.firebase.sign_in_provider,
        },
      }

      return new AuthProviderEntity(authProvider)
    } catch (error) {
      console.error('Firebase token verification failed:', error)
      return null
    }
  }

  async findLinkedProviderTypes(externalId: string): Promise<ProviderType[]> {
    const authClient = getFirebaseAdminAuthClient()
    const userRecord = await authClient.getUser(externalId)
    const linkedProviderIds = userRecord.providerData.map((p) => p.providerId)

    return (Object.keys(FIREBASE_PROVIDER_IDS) as ProviderType[]).filter(
      (providerType) =>
        linkedProviderIds.includes(FIREBASE_PROVIDER_IDS[providerType] ?? '')
    )
  }

  async unlinkProviders(
    externalId: string,
    providerTypes: readonly ProviderType[]
  ): Promise<void> {
    const providersToUnlink = providerTypes
      .map((providerType) => FIREBASE_PROVIDER_IDS[providerType])
      .filter((providerId): providerId is string => providerId !== undefined)

    if (providersToUnlink.length === 0) return

    const authClient = getFirebaseAdminAuthClient()
    await authClient.updateUser(externalId, { providersToUnlink })
  }

  async restoreEmailFromProvider(
    externalId: string,
    providerType: ProviderType
  ): Promise<void> {
    const authClient = getFirebaseAdminAuthClient()
    const userRecord = await authClient.getUser(externalId)
    if (userRecord.email) return

    const providerEmail = userRecord.providerData.find(
      (p) => p.providerId === FIREBASE_PROVIDER_IDS[providerType]
    )?.email
    if (!providerEmail) return

    try {
      await authClient.updateUser(externalId, {
        email: providerEmail,
        emailVerified: true,
      })
    } catch (error) {
      console.error(
        'Firebaseアカウントのメールアドレス復元に失敗しました',
        error
      )
    }
  }

  public async verifyIdToken(token: string): Promise<DecodedIdToken | null> {
    try {
      const authClient = getFirebaseAdminAuthClient()
      return await authClient.verifyIdToken(token, false)
    } catch (error) {
      console.error('Token verification error:', error)
      return null
    }
  }

  public getProviderType(decodedToken: DecodedIdToken): ProviderType {
    const firebaseProvider = decodedToken.firebase.sign_in_provider

    if (firebaseProvider === 'google.com') {
      return ProviderTypeMap.FIREBASE_GOOGLE
    }

    if (firebaseProvider === 'password') {
      return ProviderTypeMap.FIREBASE_EMAIL
    }

    if (firebaseProvider === 'anonymous') {
      return ProviderTypeMap.FIREBASE_ANONYMOUS
    }

    throw new Error(`Unsupported provider type: ${firebaseProvider}`)
  }
}
