import type { DecodedIdToken } from 'firebase-admin/auth'
import { firebaseAdminAuthClient } from '@packages/firebase-auth-server'
import {
  AuthProvider,
  ProviderTypeMap,
  type ProviderType,
} from '@shared-types/index'
import { createUserId } from '@shared-types/index'
import { IAuthRepository } from '../../interfaces/IAuthRepository'
import { AuthProviderEntity } from '../entities/AuthProviderEntity'

export class FirebaseAuthRepository implements IAuthRepository {
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

  public async verifyIdToken(token: string): Promise<DecodedIdToken | null> {
    try {
      return await firebaseAdminAuthClient.verifyIdToken(token, true)
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

    throw new Error(`Unsupported provider type: ${firebaseProvider}`)
  }
}
