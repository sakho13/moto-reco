import { afterEach, describe, expect, test, vi } from 'vitest'
import { prisma } from '@repo/database'
import { ResendEmailRepository } from '@repo/email'
import { getFirebaseAdminAuthClient } from '@repo/firebase-auth-server'
import { createGuestUser, createTestUser } from '../../helpers/authHelper'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import {
  handleGoogleSignInByFirebase,
  handleLinkGoogleToCurrentUser,
  handleLoginByFirebase,
  handleSetPasswordToCurrentUser,
} from '../../helpers/firebaseTestToken'
import { app } from '@/lib/api/server/app'

afterEach(() => {
  vi.restoreAllMocks()
})

const getProfile = (token: string) =>
  app.request('/api/v1/user/profile', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })

const switchProvider = (token: string, providerType: string) =>
  app.request('/api/v1/user/auth/provider', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ providerType }),
  })

const register = (token: string, name: string) =>
  app.request('/api/v1/user/auth/register', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  })

const quit = (token: string) =>
  app.request('/api/v1/user/auth/quit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quitReason: 'テスト退会理由' }),
  })

const findAuthProviders = (externalId: string) =>
  prisma.mAuthProvider.findMany({
    where: { externalId },
    select: { userId: true, providerType: true },
  })

const findFirebaseProviderIds = async (uid: string) => {
  const userRecord = await getFirebaseAdminAuthClient().getUser(uid)
  return userRecord.providerData.map((p) => p.providerId).sort()
}

const signInWithGoogle = async (email: string) => {
  const credential = await handleGoogleSignInByFirebase(email)
  return {
    token: await credential.user.getIdToken(),
    uid: credential.user.uid,
  }
}

const createGoogleTestUser = async () => {
  const email = createRandomEmail()
  const { token, uid } = await signInWithGoogle(email)
  const res = await register(token, 'Googleユーザー')
  const json = await res.json()
  return { token, uid, email, userId: json.data.userId as string }
}

describe('PUT /api/v1/user/auth/provider', () => {
  test('メール/パスワードのユーザーがGoogleを紐付けて切り替えると、Firebaseからpasswordが外れDBがFIREBASE_GOOGLEになる', async () => {
    const { token, userId, email } = await createTestUser()
    const linked = await handleLinkGoogleToCurrentUser(email)
    const uid = linked.user.uid

    const res = await switchProvider(token, 'FIREBASE_GOOGLE')

    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data).toEqual({
      providerType: 'FIREBASE_GOOGLE',
      switched: true,
    })
    expect(await findFirebaseProviderIds(uid)).toEqual(['google.com'])
    expect(await findAuthProviders(uid)).toEqual([
      { userId, providerType: 'FIREBASE_GOOGLE' },
    ])
    expect((await getFirebaseAdminAuthClient().getUser(uid)).email).toBe(email)

    const { token: googleToken } = await signInWithGoogle(email)
    const profileRes = await getProfile(googleToken)
    expect(profileRes.status).toBe(200)
    expect((await profileRes.json()).data.userId).toBe(userId)
  })

  test('Googleのユーザーがパスワードを設定して切り替えると、Firebaseからgoogle.comが外れDBがFIREBASE_EMAILになる', async () => {
    const { token, uid, email, userId } = await createGoogleTestUser()
    await handleSetPasswordToCurrentUser('password123')

    const res = await switchProvider(token, 'FIREBASE_EMAIL')

    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data).toEqual({
      providerType: 'FIREBASE_EMAIL',
      switched: true,
    })
    expect(await findFirebaseProviderIds(uid)).toEqual(['password'])
    expect(await findAuthProviders(uid)).toEqual([
      { userId, providerType: 'FIREBASE_EMAIL' },
    ])

    const credential = await handleLoginByFirebase(email, 'password123')
    const profileRes = await getProfile(await credential.user.getIdToken())
    expect(profileRes.status).toBe(200)
    expect((await profileRes.json()).data.userId).toBe(userId)
  })

  test('紐付いていない認証方式を指定するとINVALID_REQUESTとなり、何も変わらない', async () => {
    const { token, userId } = await createTestUser()
    const { externalId: uid } = await prisma.mAuthProvider.findUniqueOrThrow({
      where: { userId },
    })

    const res = await switchProvider(token, 'FIREBASE_GOOGLE')

    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.errorCode).toBe('INVALID_REQUEST')
    expect(await findFirebaseProviderIds(uid)).toEqual(['password'])
    expect(await findAuthProviders(uid)).toEqual([
      { userId, providerType: 'FIREBASE_EMAIL' },
    ])
  })

  test('現在と同じ認証方式を指定するとswitched: falseとなる', async () => {
    const { token } = await createTestUser()

    const res = await switchProvider(token, 'FIREBASE_EMAIL')

    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data).toEqual({
      providerType: 'FIREBASE_EMAIL',
      switched: false,
    })
  })

  test('ゲストユーザーはINVALID_REQUESTとなる', async () => {
    const { token } = await createGuestUser()

    const res = await switchProvider(token, 'FIREBASE_GOOGLE')

    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.errorCode).toBe('INVALID_REQUEST')
  })

  test('切り替え先として匿名認証は指定できない', async () => {
    const { token } = await createTestUser()

    const res = await switchProvider(token, 'FIREBASE_ANONYMOUS')

    expect(res.status).toBe(400)
  })
})

describe('同一UIDで認証方式が異なるトークンの扱い', () => {
  test('メールの行のユーザーが同じUIDのGoogleトークンでアクセスすると同じユーザーが返り、行は増えない', async () => {
    const { userId, email } = await createTestUser()

    const { token, uid } = await signInWithGoogle(email)
    const res = await getProfile(token)

    expect(res.status).toBe(200)
    expect((await res.json()).data.userId).toBe(userId)
    expect(await findAuthProviders(uid)).toEqual([
      { userId, providerType: 'FIREBASE_EMAIL' },
    ])
  })

  test('メールの行のユーザーが同じUIDのGoogleトークンで登録すると既存ユーザーが返り、MUserは増えない', async () => {
    const sendSpy = vi
      .spyOn(ResendEmailRepository.prototype, 'send')
      .mockResolvedValue()
    const { userId, email } = await createTestUser()
    sendSpy.mockClear()

    const { token, uid } = await signInWithGoogle(email)
    const res = await register(token, '別名で登録')

    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.data.userId).toBe(userId)
    expect(json.data.name).not.toBe('別名で登録')
    expect(await findAuthProviders(uid)).toEqual([
      { userId, providerType: 'FIREBASE_EMAIL' },
    ])
    expect(sendSpy).not.toHaveBeenCalled()
  })

  test('退会済みユーザーが同じUIDのGoogleトークンでアクセスするとUSER_QUITとなる', async () => {
    vi.spyOn(ResendEmailRepository.prototype, 'send').mockResolvedValue()
    const { token: emailToken, email } = await createTestUser()
    expect((await quit(emailToken)).status).toBe(200)

    const { token } = await signInWithGoogle(email)
    const profileRes = await getProfile(token)
    expect(profileRes.status).toBe(403)
    expect((await profileRes.json()).errorCode).toBe('USER_QUIT')

    const registerRes = await register(token, '再登録')
    expect(registerRes.status).toBe(403)
    expect((await registerRes.json()).errorCode).toBe('USER_QUIT')
  })
})
