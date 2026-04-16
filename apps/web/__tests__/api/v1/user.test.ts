import { describe, expect, test } from 'vitest'
import { prisma } from '@repo/database'
import { createTestUser, testAuthRequired } from '../../helpers/authHelper'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import {
  handleAnonymousSignInByFirebase,
  handleRegisterByFirebase,
} from '../../helpers/firebaseTestToken'
import { app } from '@/lib/api/server/app'

describe('User API Endpoints', () => {
  describe('POST /api/v1/user/profile', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '新しい名前',
        }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'error',
        errorCode: 'AUTH_FAILED',
        message: expect.any(String),
      })
      expect(res.status).toBe(401)
    })

    test('ユーザ名が空文字でエラーとなる', async () => {
      const email = createRandomEmail()
      const credential = await handleRegisterByFirebase(email, 'password')
      const token = await credential.user.getIdToken()
      const registeredRes = await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'test_ユーザ名が空文字でエラーとなる',
        }),
      })
      expect(registeredRes.status).toBe(201)

      const res = await app.request('/api/v1/user/profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '',
        }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: expect.any(String),
        details: [
          {
            field: 'name',
            message: expect.any(String),
          },
        ],
      })
      expect(res.status).toBe(400)
    })

    test('ユーザ名が50文字を超える場合にエラーとなる', async () => {
      const email = createRandomEmail()
      const credential = await handleRegisterByFirebase(email, 'password')
      const token = await credential.user.getIdToken()
      const registeredRes = await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'test_ユーザ名が50文字を超える場合にエラーとなる',
        }),
      })
      expect(registeredRes.status).toBe(201)

      const res = await app.request('/api/v1/user/profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'a'.repeat(51),
        }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: expect.any(String),
        details: [
          {
            field: 'name',
            message: expect.any(String),
          },
        ],
      })
      expect(res.status).toBe(400)
    })

    test('ユーザ名が更新できる', async () => {
      const email = createRandomEmail()
      const credential = await handleRegisterByFirebase(email, 'password')
      const token = await credential.user.getIdToken()
      const registeredRes = await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'test_ユーザ名が更新できる',
        }),
      })
      expect(registeredRes.status).toBe(201)

      const res = await app.request('/api/v1/user/profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '更新後の名前',
        }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'success',
        data: {
          userId: expect.any(String),
          name: '更新後の名前',
        },
        message: expect.any(String),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/v1/user/auth/register', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'テストユーザー',
        }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'error',
        errorCode: 'AUTH_FAILED',
        message: expect.any(String),
      })
      expect(res.status).toBe(401)
    })

    test('新規ユーザー登録ができる', async () => {
      const email = createRandomEmail()
      const credential = await handleRegisterByFirebase(email, 'password')
      const token = await credential.user.getIdToken()
      const res = await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'テストユーザー',
        }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'success',
        data: {
          userId: expect.any(String),
          name: 'テストユーザー',
        },
        message: expect.any(String),
      })
      expect(json.data.userId).not.toBe('')
      expect(res.status).toBe(201)
    })

    test('既存ユーザーの場合も201を返す（冪等性）', async () => {
      const email = createRandomEmail()
      const credential = await handleRegisterByFirebase(email, 'password')
      const token = await credential.user.getIdToken()

      // 1回目の登録
      const res1 = await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'テストユーザー',
        }),
      })
      expect(res1.status).toBe(201)
      const json1 = await res1.json()

      // 2回目の登録（同じトークン）
      const res2 = await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '別の名前',
        }),
      })
      expect(res2.status).toBe(201)
      const json2 = await res2.json()

      // 同じユーザーIDが返却されることを確認（冪等性）
      expect(json1.data.userId).toBe(json2.data.userId)
      // 既存の名前が保持されることを確認
      expect(json2.data.name).toBe('テストユーザー')
    })
  })

  describe('POST /api/v1/user/auth/quit', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user/auth/quit', 'POST', {
        quitReason: 'テスト退会理由',
      })
    })

    test('退会理由が空文字でエラーとなる', async () => {
      const { token } = await createTestUser()
      const res = await app.request('/api/v1/user/auth/quit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quitReason: '',
        }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: expect.any(String),
        details: [
          {
            field: 'quitReason',
            message: expect.any(String),
          },
        ],
      })
      expect(res.status).toBe(400)
    })

    test('退会処理が完了し復帰コードが返却される', async () => {
      const { token, userId } = await createTestUser()
      const quitReason = 'テスト退会理由'
      const res = await app.request('/api/v1/user/auth/quit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quitReason,
        }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'success',
        data: {
          recoveryCode: expect.any(String),
        },
        message: expect.any(String),
      })
      expect(res.status).toBe(200)
      expect(json.data.recoveryCode).toHaveLength(5)

      const quitRecord = await prisma.tUserQuit.findUnique({
        where: { userId },
      })
      expect(quitRecord).not.toBeNull()
      expect(quitRecord?.quitReason).toBe(quitReason)
      expect(quitRecord?.recoveryCode).toBe(json.data.recoveryCode)
      expect(quitRecord?.status).toBe('QUIT')

      const userRecord = await prisma.mUser.findUnique({
        where: { id: userId },
        select: { status: true },
      })
      expect(userRecord?.status).toBe('INACTIVE')

      const authProviders = await prisma.mAuthProvider.findMany({
        where: { userId },
        select: { isActive: true },
      })
      expect(authProviders.length).toBeGreaterThan(0)
      expect(
        authProviders.every((provider) => provider.isActive === false)
      ).toBe(true)
    })
  })

  describe('POST /api/v1/user/auth/recover', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user/auth/recover', 'POST', {
        recoveryCode: '12345',
      })
    })

    test('復帰コードが空文字でエラーとなる', async () => {
      const { token } = await createTestUser()
      const res = await app.request('/api/v1/user/auth/recover', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recoveryCode: '',
        }),
      })

      const json = await res.json()
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
      expect(json.message).toBeDefined()
      expect(json.details).toEqual(
        expect.arrayContaining([
          {
            field: 'recoveryCode',
            message: expect.any(String),
          },
        ])
      )
      expect(res.status).toBe(400)
    })

    test('復帰処理が完了しユーザーが有効化される', async () => {
      const { token, userId } = await createTestUser()
      const quitReason = 'テスト退会理由'
      const quitRes = await app.request('/api/v1/user/auth/quit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quitReason,
        }),
      })
      const quitJson = await quitRes.json()

      const res = await app.request('/api/v1/user/auth/recover', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recoveryCode: quitJson.data.recoveryCode,
        }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'success',
        data: {
          userId,
        },
        message: expect.any(String),
      })
      expect(res.status).toBe(200)

      const quitRecord = await prisma.tUserQuit.findUnique({
        where: { userId },
      })
      expect(quitRecord).not.toBeNull()
      expect(quitRecord?.status).toBe('RECOVERED')

      const userRecord = await prisma.mUser.findUnique({
        where: { id: userId },
        select: { status: true },
      })
      expect(userRecord?.status).toBe('ACTIVE')

      const authProviders = await prisma.mAuthProvider.findMany({
        where: { userId },
        select: { isActive: true },
      })
      expect(authProviders.length).toBeGreaterThan(0)
      expect(
        authProviders.every((provider) => provider.isActive === true)
      ).toBe(true)
    })
  })

  describe('POST /api/v1/user/auth/guest/register', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user/auth/guest/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const json = await res.json()
      expect(json).toMatchObject({
        status: 'error',
        errorCode: 'AUTH_FAILED',
      })
      expect(res.status).toBe(401)
    })

    test('匿名トークンでゲストユーザーが登録される', async () => {
      const credential = await handleAnonymousSignInByFirebase()
      const token = await credential.user.getIdToken()

      const res = await app.request('/api/v1/user/auth/guest/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json).toMatchObject({
        status: 'success',
        data: {
          userId: expect.any(String),
          name: expect.any(String),
        },
      })

      // DBでGUESTロールを確認
      const userId = json.data.userId
      const dbUser = await prisma.mUser.findFirst({
        where: { id: userId },
        select: { role: true },
      })
      expect(dbUser?.role).toBe('GUEST')
    })

    test('ゲストユーザー名を指定して登録できる', async () => {
      const credential = await handleAnonymousSignInByFirebase()
      const token = await credential.user.getIdToken()

      const res = await app.request('/api/v1/user/auth/guest/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'テストゲスト' }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.name).toBe('テストゲスト')
    })

    test('通常の認証トークンではゲスト登録できない', async () => {
      const email = createRandomEmail()
      const credential = await handleRegisterByFirebase(email, 'password')
      const token = await credential.user.getIdToken()

      const res = await app.request('/api/v1/user/auth/guest/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const json = await res.json()
      expect(json).toMatchObject({
        status: 'error',
        errorCode: 'INVALID_REQUEST',
      })
      expect(res.status).toBe(400)
    })

    test('同一匿名UIDでの重複登録は既存ユーザーを返す（冪等性）', async () => {
      const credential = await handleAnonymousSignInByFirebase()
      const token = await credential.user.getIdToken()

      const res1 = await app.request('/api/v1/user/auth/guest/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      const json1 = await res1.json()

      const res2 = await app.request('/api/v1/user/auth/guest/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      const json2 = await res2.json()

      expect(json1.data.userId).toBe(json2.data.userId)
    })
  })
})
