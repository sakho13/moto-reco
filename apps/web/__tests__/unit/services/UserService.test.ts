import { describe, expect, test } from 'vitest'
import { AuthProviderEntity } from '@repo/shared-domain'
import { createUserId } from '@repo/shared-types'
import { UserService } from '@/lib/api/server/services/UserService'

const buildAuthProvider = (metadata?: Record<string, unknown>) =>
  new AuthProviderEntity({
    userId: createUserId('uid'),
    externalId: 'uid',
    providerType: 'FIREBASE_EMAIL',
    isActive: true,
    metadata,
  })

describe('UserService', () => {
  describe('getVerifiedEmail / getUnverifiedEmail', () => {
    test('確認済みのメールアドレスは通知先として扱われる', () => {
      const authProvider = buildAuthProvider({
        email: 'rider@example.com',
        emailVerified: true,
      })
      expect(UserService.getVerifiedEmail(authProvider)).toBe(
        'rider@example.com'
      )
      expect(UserService.getUnverifiedEmail(authProvider)).toBeNull()
    })

    test.each([false, undefined])(
      '未確認（emailVerified: %s）のメールアドレスは通知先として扱われない',
      (emailVerified) => {
        const authProvider = buildAuthProvider({
          email: 'rider@example.com',
          emailVerified,
        })
        expect(UserService.getVerifiedEmail(authProvider)).toBeNull()
        expect(UserService.getUnverifiedEmail(authProvider)).toBe(
          'rider@example.com'
        )
      }
    )

    test('メールアドレスがない場合はどちらも null になる', () => {
      const authProvider = buildAuthProvider(undefined)
      expect(UserService.getVerifiedEmail(authProvider)).toBeNull()
      expect(UserService.getUnverifiedEmail(authProvider)).toBeNull()
    })
  })
})
