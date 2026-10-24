import { afterEach, describe, expect, test, vi } from 'vitest'
import { prisma } from '@repo/database'
import { ResendEmailRepository } from '@repo/email'
import { createTestUser } from '../../helpers/authHelper'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import { handleGoogleSignInByFirebase } from '../../helpers/firebaseTestToken'
import { app } from '@/lib/api/server/app'

afterEach(() => {
  vi.restoreAllMocks()
})

const getProfile = (token: string) =>
  app.request('/api/v1/user/profile', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })

const findAuthProviders = (externalId: string) =>
  prisma.mAuthProvider.findMany({
    where: { externalId },
    select: { userId: true, providerType: true, isActive: true },
    orderBy: { createdAt: 'asc' },
  })

const signInWithGoogle = async (email: string) => {
  const credential = await handleGoogleSignInByFirebase(email)
  return {
    token: await credential.user.getIdToken(),
    uid: credential.user.uid,
  }
}

describe('認証方式の紐付け', () => {
  describe('GET /api/v1/user/profile', () => {
    test('メール登録済みユーザーが同じUIDのGoogleトークンでアクセスすると同じユーザーが返り、FIREBASE_GOOGLEの行が追加される', async () => {
      const { userId, email } = await createTestUser()

      const { token, uid } = await signInWithGoogle(email)
      const res = await getProfile(token)

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.userId).toBe(userId)

      const providers = await findAuthProviders(uid)
      expect(providers).toEqual([
        { userId, providerType: 'FIREBASE_EMAIL', isActive: true },
        { userId, providerType: 'FIREBASE_GOOGLE', isActive: true },
      ])
    })

    test('2回目以降のアクセスでは行が増えない', async () => {
      const { userId, email } = await createTestUser()
      const { token, uid } = await signInWithGoogle(email)

      expect((await getProfile(token)).status).toBe(200)
      const res = await getProfile(token)

      expect(res.status).toBe(200)
      expect((await res.json()).data.userId).toBe(userId)
      expect(await findAuthProviders(uid)).toHaveLength(2)
    })

    test('同時にアクセスしてもエラーにならず、FIREBASE_GOOGLEの行は1つだけ追加される', async () => {
      const { userId, email } = await createTestUser()
      const { token, uid } = await signInWithGoogle(email)

      const responses = await Promise.all([
        getProfile(token),
        getProfile(token),
        getProfile(token),
      ])

      for (const res of responses) {
        expect(res.status).toBe(200)
        expect((await res.json()).data.userId).toBe(userId)
      }
      const providers = await findAuthProviders(uid)
      expect(
        providers.filter((p) => p.providerType === 'FIREBASE_GOOGLE')
      ).toHaveLength(1)
      expect(providers).toHaveLength(2)
    })

    test('退会済みユーザーがGoogleトークンでアクセスするとUSER_QUITとなり、行は追加されない', async () => {
      vi.spyOn(ResendEmailRepository.prototype, 'send').mockResolvedValue()
      const { token: emailToken, email } = await createTestUser()

      const quitRes = await app.request('/api/v1/user/auth/quit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${emailToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quitReason: 'テスト退会理由' }),
      })
      expect(quitRes.status).toBe(200)

      const { token, uid } = await signInWithGoogle(email)
      const res = await getProfile(token)

      const json = await res.json()
      expect(res.status).toBe(403)
      expect(json.errorCode).toBe('USER_QUIT')
      expect(await findAuthProviders(uid)).toEqual([
        expect.objectContaining({ providerType: 'FIREBASE_EMAIL' }),
      ])
    })
  })

  describe('POST /api/v1/user/auth/register', () => {
    test('未登録のGoogleユーザーはFIREBASE_GOOGLEで新規登録される', async () => {
      const { token, uid } = await signInWithGoogle(createRandomEmail())

      const res = await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Googleユーザー' }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(await findAuthProviders(uid)).toEqual([
        {
          userId: json.data.userId,
          providerType: 'FIREBASE_GOOGLE',
          isActive: true,
        },
      ])
    })

    test('メール登録済みユーザーが同じUIDのGoogleトークンで登録すると既存ユーザーが返り、MUserは増えない', async () => {
      const sendSpy = vi
        .spyOn(ResendEmailRepository.prototype, 'send')
        .mockResolvedValue()
      const { userId, email } = await createTestUser()
      sendSpy.mockClear()

      const { token, uid } = await signInWithGoogle(email)
      const res = await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '別名で登録' }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.userId).toBe(userId)
      expect(json.data.name).not.toBe('別名で登録')

      const providers = await findAuthProviders(uid)
      expect(new Set(providers.map((p) => p.userId))).toEqual(new Set([userId]))
      expect(providers.map((p) => p.providerType)).toEqual([
        'FIREBASE_EMAIL',
        'FIREBASE_GOOGLE',
      ])
      expect(sendSpy).not.toHaveBeenCalled()
    })

    test('退会済みユーザーが同じUIDのGoogleトークンで登録しようとするとUSER_QUITとなる', async () => {
      vi.spyOn(ResendEmailRepository.prototype, 'send').mockResolvedValue()
      const { token: emailToken, email } = await createTestUser()

      await app.request('/api/v1/user/auth/quit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${emailToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quitReason: 'テスト退会理由' }),
      })

      const { token, uid } = await signInWithGoogle(email)
      const res = await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '再登録' }),
      })

      const json = await res.json()
      expect(res.status).toBe(403)
      expect(json.errorCode).toBe('USER_QUIT')
      expect(await findAuthProviders(uid)).toHaveLength(1)
    })
  })
})
