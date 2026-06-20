import type { DecodedIdToken } from 'firebase-admin/auth'
import { getFirebaseAdminAuthClient } from '@repo/firebase-auth-server'
import {
  AuthProvider,
  ProviderTypeMap,
  type ProviderType,
} from '@repo/shared-types'
import { createUserId } from '@repo/shared-types'
import { AuthProviderEntity } from '../entities/AuthProviderEntity'
import { IAuthRepository } from '../interfaces/IAuthRepository'

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
      const authClient = getFirebaseAdminAuthClient()
      console.log(
        '[FirebaseAuth] verifyIdToken: calling authClient.verifyIdToken (checkRevoked=true)'
      )
      const result = await authClient.verifyIdToken(token, true)
      console.log('[FirebaseAuth] verifyIdToken: success, uid=', result.uid)
      return result
    } catch (error) {
      console.error('[FirebaseAuth] verifyIdToken: error type=', typeof error)
      if (error instanceof Error) {
        console.error('[FirebaseAuth] verifyIdToken: name=', error.name)
        console.error('[FirebaseAuth] verifyIdToken: message=', error.message)
        console.error(
          '[FirebaseAuth] verifyIdToken: code=',
          (error as NodeJS.ErrnoException).code
        )
        console.error('[FirebaseAuth] verifyIdToken: stack=', error.stack)
        const cause = (error as Error & { cause?: unknown }).cause
        if (cause) {
          console.error('[FirebaseAuth] verifyIdToken: cause=', cause)
          if (cause instanceof Error) {
            console.error(
              '[FirebaseAuth] verifyIdToken: cause.message=',
              cause.message
            )
            console.error(
              '[FirebaseAuth] verifyIdToken: cause.stack=',
              cause.stack
            )
          }
        }
      } else {
        console.error(
          '[FirebaseAuth] verifyIdToken: non-Error thrown=',
          JSON.stringify(error)
        )
      }
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
