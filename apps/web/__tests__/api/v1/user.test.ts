import { afterEach, describe, expect, test, vi } from 'vitest'
import { prisma } from '@repo/database'
import { ResendEmailRepository } from '@repo/email'
import {
  createGuestUser,
  createTestUser,
  testAuthRequired,
} from '../../helpers/authHelper'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import {
  handleAnonymousSignInByFirebase,
  handleRegisterByFirebase,
} from '../../helpers/firebaseTestToken'
import { createAdminUser } from '../../helpers/notificationHelper'
import { app } from '@/lib/api/server/app'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('User API Endpoints', () => {
  describe('PATCH /api/v1/user/profile', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user/profile', {
        method: 'PATCH',
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
        method: 'PATCH',
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
        method: 'PATCH',
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

    test('フィールドが1つも指定されない場合にエラーとなる', async () => {
      const email = createRandomEmail()
      const credential = await handleRegisterByFirebase(email, 'password')
      const token = await credential.user.getIdToken()
      await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'test_フィールドが1つも指定されない場合にエラーとなる',
        }),
      })

      const res = await app.request('/api/v1/user/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const json = await res.json()
      expect(json).toMatchObject({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: expect.any(String),
      })
      expect(res.status).toBe(400)
    })

    test('ユーザ名のみ更新できる', async () => {
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
          name: 'test_ユーザ名のみ更新できる',
        }),
      })
      expect(registeredRes.status).toBe(201)

      const res = await app.request('/api/v1/user/profile', {
        method: 'PATCH',
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
          notificationEmail: expect.any(String),
          isProfilePublic: expect.any(Boolean),
          role: expect.any(String),
          plan: expect.any(String),
        },
        message: expect.any(String),
      })
      expect(res.status).toBe(200)
    })

    test('通知メールアドレスのみ更新できる', async () => {
      const email = createRandomEmail()
      const credential = await handleRegisterByFirebase(email, 'password')
      const token = await credential.user.getIdToken()
      await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'test_通知メールアドレスのみ更新できる',
        }),
      })

      const notificationEmail = createRandomEmail()
      const res = await app.request('/api/v1/user/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationEmail,
        }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'success',
        data: {
          userId: expect.any(String),
          name: 'test_通知メールアドレスのみ更新できる',
          notificationEmail,
          isProfilePublic: expect.any(Boolean),
          role: expect.any(String),
          plan: expect.any(String),
        },
        message: expect.any(String),
      })
      expect(res.status).toBe(200)
    })

    test('isProfilePublicのみfalseに更新できる', async () => {
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
          name: 'test_isProfilePublicのみfalseに更新できる',
        }),
      })
      expect(registeredRes.status).toBe(201)

      const res = await app.request('/api/v1/user/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isProfilePublic: false }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'success',
        data: {
          userId: expect.any(String),
          name: 'test_isProfilePublicのみfalseに更新できる',
          notificationEmail: expect.any(String),
          isProfilePublic: false,
          role: expect.any(String),
          plan: expect.any(String),
        },
        message: expect.any(String),
      })
      expect(res.status).toBe(200)
    })

    test('isProfilePublicのみtrueに更新できる', async () => {
      const email = createRandomEmail()
      const credential = await handleRegisterByFirebase(email, 'password')
      const token = await credential.user.getIdToken()
      await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'test_isProfilePublicのみtrueに更新できる',
        }),
      })

      // 前提: まず false に変更
      await app.request('/api/v1/user/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isProfilePublic: false }),
      })

      // true に戻す
      const res = await app.request('/api/v1/user/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isProfilePublic: true }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'success',
        data: {
          userId: expect.any(String),
          name: 'test_isProfilePublicのみtrueに更新できる',
          notificationEmail: expect.any(String),
          isProfilePublic: true,
          role: expect.any(String),
          plan: expect.any(String),
        },
        message: expect.any(String),
      })
      expect(res.status).toBe(200)
    })

    test('isProfilePublicに文字列を指定した場合にバリデーションエラーとなる', async () => {
      const email = createRandomEmail()
      const credential = await handleRegisterByFirebase(email, 'password')
      const token = await credential.user.getIdToken()
      await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'test_isProfilePublicに文字列を指定した場合にバリデーションエラーとなる',
        }),
      })

      const res = await app.request('/api/v1/user/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isProfilePublic: 'true' }),
      })

      const json = await res.json()
      expect(json).toMatchObject({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: expect.any(String),
      })
      expect(res.status).toBe(400)
    })

    test('ゲストアカウントがisProfilePublicをtrueに設定しようとするとエラーになる', async () => {
      const { token } = await createGuestUser()

      const res = await app.request('/api/v1/user/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isProfilePublic: true }),
      })

      const json = await res.json()
      expect(json).toMatchObject({
        status: 'error',
        errorCode: 'INVALID_REQUEST',
        message: expect.any(String),
      })
      expect(res.status).toBe(400)
    })

    test('ゲストアカウントはisProfilePublicをfalseに設定できる', async () => {
      const { token } = await createGuestUser()

      const res = await app.request('/api/v1/user/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isProfilePublic: false }),
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.isProfilePublic).toBe(false)
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

    test('新規ユーザー登録時にWelcomeメールを送信する', async () => {
      const sendSpy = vi
        .spyOn(ResendEmailRepository.prototype, 'send')
        .mockResolvedValue()

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
          name: 'Welcomeテストユーザー',
        }),
      })

      expect(res.status).toBe(201)
      expect(sendSpy).toHaveBeenCalledTimes(1)
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
          notificationEmail: expect.any(String),
          isProfilePublic: expect.any(Boolean),
          role: expect.any(String),
          plan: 'FREE',
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

    test('匿名トークンでは通常登録できない', async () => {
      const credential = await handleAnonymousSignInByFirebase()
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
      expect(json).toMatchObject({
        status: 'error',
        errorCode: 'INVALID_REQUEST',
      })
      expect(res.status).toBe(400)
    })

    test('退会済みユーザーが再登録しようとするとUSER_QUITエラーとなる（500エラーにならない）', async () => {
      vi.spyOn(ResendEmailRepository.prototype, 'send').mockResolvedValue()

      const { token } = await createTestUser()

      await app.request('/api/v1/user/auth/quit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quitReason: 'テスト退会理由' }),
      })

      const res = await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '再登録テストユーザー' }),
      })

      const json = await res.json()
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('USER_QUIT')
      expect(res.status).toBe(403)
    })
  })

  describe('退会済みユーザーの認証済みAPIアクセス', () => {
    test('退会済みユーザーが認証必須APIを呼び出すとUSER_QUITエラーとなる', async () => {
      vi.spyOn(ResendEmailRepository.prototype, 'send').mockResolvedValue()

      const { token } = await createTestUser()

      await app.request('/api/v1/user/auth/quit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quitReason: 'テスト退会理由' }),
      })

      const res = await app.request('/api/v1/user/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = await res.json()
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('USER_QUIT')
      expect(res.status).toBe(403)
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

    test('GUESTロールは退会できない', async () => {
      const { token } = await createGuestUser()
      const res = await app.request('/api/v1/user/auth/quit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quitReason: 'テスト退会理由' }),
      })

      const json = await res.json()
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('FORBIDDEN')
      expect(res.status).toBe(403)
    })

    test('ADMINロールは退会できない', async () => {
      const { token, userId } = await createTestUser()
      await createAdminUser(token, userId)

      const res = await app.request('/api/v1/user/auth/quit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quitReason: 'テスト退会理由' }),
      })

      const json = await res.json()
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('FORBIDDEN')
      expect(res.status).toBe(403)
    })

    test('退会処理が完了し復帰案内メールが送信される（レスポンスにトークン等は含まれない）', async () => {
      const { token, userId } = await createTestUser()

      // createTestUser内の登録処理で送られるWelcomeメールを除外するため、
      // 退会APIを呼ぶ直前にspyを仕込む
      const sendSpy = vi
        .spyOn(ResendEmailRepository.prototype, 'send')
        .mockResolvedValue()

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
        data: {},
        message: expect.any(String),
      })
      expect(res.status).toBe(200)
      expect(sendSpy).toHaveBeenCalledTimes(1)

      const quitRecord = await prisma.tUserQuit.findUnique({
        where: { userId },
      })
      expect(quitRecord).not.toBeNull()
      expect(quitRecord?.quitReason).toBe(quitReason)
      expect(quitRecord?.status).toBe('QUIT')
      expect(quitRecord?.recoveryTokenHash).toEqual(expect.any(String))
      expect(quitRecord?.purgeAt.getTime()).toBeGreaterThan(
        quitRecord!.quitAt.getTime()
      )

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
    /** 退会メールのHTML本文から復帰用の平文トークンを抽出する */
    const extractRecoveryToken = (html: string): string => {
      const match = html.match(/token=([^"&]+)/)
      const token = match?.[1]
      if (!token) throw new Error('復帰トークンが見つかりませんでした')
      return token
    }

    test('tokenが空文字でエラーとなる', async () => {
      const res = await app.request('/api/v1/user/auth/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: '' }),
      })

      const json = await res.json()
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
      expect(res.status).toBe(400)
    })

    test('Authorizationヘッダーが無くても呼び出せる（公開エンドポイント）', async () => {
      const res = await app.request('/api/v1/user/auth/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: 'invalid-token' }),
      })

      const json = await res.json()
      // 認証エラーではなく、トークン不正のエラーになること
      expect(json.errorCode).not.toBe('AUTH_FAILED')
      expect(json.errorCode).toBe('NOT_FOUND')
      expect(res.status).toBe(404)
    })

    test('復帰処理が完了しユーザーが有効化される（ワンタイム化される）', async () => {
      const { token, userId } = await createTestUser()

      // createTestUser内の登録処理で送られるWelcomeメールを除外するため、
      // 退会APIを呼ぶ直前にspyを仕込む
      const sendSpy = vi
        .spyOn(ResendEmailRepository.prototype, 'send')
        .mockResolvedValue()

      const quitReason = 'テスト退会理由'
      await app.request('/api/v1/user/auth/quit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quitReason,
        }),
      })

      expect(sendSpy).toHaveBeenCalledTimes(1)
      const sentHtml = sendSpy.mock.calls[0]![0].html
      const recoveryToken = extractRecoveryToken(sentHtml)

      const res = await app.request('/api/v1/user/auth/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: recoveryToken,
        }),
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'success',
        data: {},
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

      // ワンタイム化: 同じトークンで再度復帰しようとするとエラーになる
      const secondRes = await app.request('/api/v1/user/auth/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: recoveryToken,
        }),
      })
      const secondJson = await secondRes.json()
      expect(secondJson.status).toBe('error')
      expect(secondJson.errorCode).toBe('INVALID_REQUEST')
      expect(secondRes.status).toBe(400)
    })

    test('猶予期間(purgeAt)を過ぎている場合は復帰できない', async () => {
      const { token, userId } = await createTestUser()

      // createTestUser内の登録処理で送られるWelcomeメールを除外するため、
      // 退会APIを呼ぶ直前にspyを仕込む
      const sendSpy = vi
        .spyOn(ResendEmailRepository.prototype, 'send')
        .mockResolvedValue()

      await app.request('/api/v1/user/auth/quit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quitReason: 'テスト退会理由' }),
      })

      const sentHtml = sendSpy.mock.calls[0]![0].html
      const recoveryToken = extractRecoveryToken(sentHtml)

      // 猶予期間を過去日時に書き換えて期限切れ状態を再現する
      await prisma.tUserQuit.update({
        where: { userId },
        data: { purgeAt: new Date('2000-01-01T00:00:00Z') },
      })

      const res = await app.request('/api/v1/user/auth/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: recoveryToken }),
      })

      const json = await res.json()
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('INVALID_REQUEST')
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/v1/user/:userId/follow', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user/dummy-id/follow', 'POST')
    })

    test('他ユーザーをフォローできる', async () => {
      const follower = await createTestUser()
      const target = await createTestUser()

      const res = await app.request(`/api/v1/user/${target.userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${follower.token}` },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.status).toBe('success')
    })

    test('自分自身をフォローしようとするとエラーとなる', async () => {
      const user = await createTestUser()

      const res = await app.request(`/api/v1/user/${user.userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      })

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.errorCode).toBe('INVALID_REQUEST')
    })

    test('重複フォローは冪等に処理される', async () => {
      const follower = await createTestUser()
      const target = await createTestUser()

      await app.request(`/api/v1/user/${target.userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${follower.token}` },
      })

      const res = await app.request(`/api/v1/user/${target.userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${follower.token}` },
      })

      expect(res.status).toBe(200)
    })
  })

  describe('DELETE /api/v1/user/:userId/follow', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user/dummy-id/follow', 'DELETE')
    })

    test('フォロー解除できる', async () => {
      const follower = await createTestUser()
      const target = await createTestUser()

      await app.request(`/api/v1/user/${target.userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${follower.token}` },
      })

      const res = await app.request(`/api/v1/user/${target.userId}/follow`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${follower.token}` },
      })

      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/v1/user/:userId/followers', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user/dummy-id/followers', 'GET')
    })

    test('フォロワー一覧が取得できる', async () => {
      const follower = await createTestUser()
      const target = await createTestUser()

      await app.request(`/api/v1/user/${target.userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${follower.token}` },
      })

      const res = await app.request(`/api/v1/user/${target.userId}/followers`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${target.token}` },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.total).toBeGreaterThanOrEqual(1)
      expect(json.data.users[0]).toMatchObject({
        userId: follower.userId,
        name: expect.any(String),
      })
    })
  })

  describe('GET /api/v1/user/:userId/following', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user/dummy-id/following', 'GET')
    })

    test('フォロー中一覧が取得できる', async () => {
      const follower = await createTestUser()
      const target = await createTestUser()

      await app.request(`/api/v1/user/${target.userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${follower.token}` },
      })

      const res = await app.request(
        `/api/v1/user/${follower.userId}/following`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${follower.token}` },
        }
      )

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.total).toBeGreaterThanOrEqual(1)
      expect(json.data.users[0]).toMatchObject({
        userId: target.userId,
        name: expect.any(String),
      })
    })
  })

  describe('GET /api/v1/user/search', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user/search?q=test', 'GET')
    })

    test('ユーザー名で検索できる', async () => {
      const unique = `search_${Date.now()}`
      const { token } = await createTestUser()

      const target = await createTestUser()
      await prisma.mUser.update({
        where: { id: target.userId },
        data: { name: `test_${unique}` },
      })

      const res = await app.request(`/api/v1/user/search?q=${unique}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.users.length).toBeGreaterThanOrEqual(1)
      expect(json.data.users[0]).toMatchObject({
        userId: expect.any(String),
        name: expect.any(String),
        isFollowing: expect.any(Boolean),
      })
    })

    test('空文字クエリで空リストが返る', async () => {
      const { token } = await createTestUser()

      const res = await app.request('/api/v1/user/search?q=', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.users).toEqual([])
      expect(json.data.total).toBe(0)
    })

    test('ゲストアカウントは検索結果に表示されない', async () => {
      const unique = `guest_search_${Date.now()}`
      const { token } = await createTestUser()
      const { userId: guestUserId } = await createGuestUser()

      await prisma.mUser.update({
        where: { id: guestUserId },
        data: { name: `test_${unique}` },
      })

      const res = await app.request(`/api/v1/user/search?q=${unique}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      const foundIds = json.data.users.map((u: { userId: string }) => u.userId)
      expect(foundIds).not.toContain(guestUserId)
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

    test('空白のみのゲストユーザー名はバリデーションエラーとなる', async () => {
      const credential = await handleAnonymousSignInByFirebase()
      const token = await credential.user.getIdToken()

      const res = await app.request('/api/v1/user/auth/guest/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '   ' }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json).toMatchObject({
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        details: expect.arrayContaining([
          {
            field: 'name',
            message: expect.any(String),
          },
        ]),
      })
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

  describe('プラン管理 API', () => {
    describe('GET /api/v1/user/profile - plan フィールド', () => {
      test('USER ロールのユーザーは plan: FREE を返す', async () => {
        const { token } = await createTestUser()

        const res = await app.request('/api/v1/user/profile', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.data.plan).toBe('FREE')
      })

      test('GUEST ロールのユーザーは plan: null を返す', async () => {
        const { token } = await createGuestUser()

        const res = await app.request('/api/v1/user/profile', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.data.plan).toBeNull()
      })
    })

    describe('GET /api/v1/user/plan/histories', () => {
      test('未認証の場合は 401 を返す', async () => {
        await testAuthRequired('/api/v1/user/plan/histories', 'GET')
      })

      test('USER ロールのユーザーは初期 FREE 履歴を取得できる', async () => {
        const { token } = await createTestUser()

        const res = await app.request('/api/v1/user/plan/histories', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.data).toHaveLength(1)
        expect(json.data[0].plan).toBe('FREE')
      })
    })

    describe('PATCH /api/v1/user/admin/plan', () => {
      test('未認証の場合は 401 を返す', async () => {
        await testAuthRequired('/api/v1/user/admin/plan', 'PATCH', {
          targetUserId: 'dummy',
          plan: 'PREMIUM',
        })
      })

      test('USER ロールが呼ぶと 403 を返す', async () => {
        const { token } = await createTestUser()
        const target = await createTestUser()

        const res = await app.request('/api/v1/user/admin/plan', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUserId: target.userId,
            plan: 'PREMIUM',
          }),
        })

        expect(res.status).toBe(403)
      })

      test('ADMIN が USER ロールのユーザーのプランを PREMIUM に変更できる', async () => {
        const admin = await createTestUser()
        await createAdminUser(admin.token, admin.userId)
        const target = await createTestUser()

        // プラン変更
        const patchRes = await app.request('/api/v1/user/admin/plan', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${admin.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUserId: target.userId,
            plan: 'PREMIUM',
            reason: 'テスト用プラン変更',
          }),
        })
        expect(patchRes.status).toBe(200)

        // 履歴を確認
        const histRes = await app.request('/api/v1/user/plan/histories', {
          method: 'GET',
          headers: { Authorization: `Bearer ${target.token}` },
        })
        const histJson = await histRes.json()

        expect(histJson.data).toHaveLength(2)
        expect(histJson.data[0].plan).toBe('PREMIUM')
        expect(histJson.data[0].reason).toBe('テスト用プラン変更')
      })

      test('存在しないユーザーIDを指定すると 404 を返す', async () => {
        const admin = await createTestUser()
        await createAdminUser(admin.token, admin.userId)

        const res = await app.request('/api/v1/user/admin/plan', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${admin.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUserId: 'nonexistent-id',
            plan: 'PREMIUM',
          }),
        })

        expect(res.status).toBe(404)
      })

      test('GUEST ロールのユーザーを対象にすると 403 を返す', async () => {
        const admin = await createTestUser()
        await createAdminUser(admin.token, admin.userId)
        const guest = await createGuestUser()

        const res = await app.request('/api/v1/user/admin/plan', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${admin.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ targetUserId: guest.userId, plan: 'PREMIUM' }),
        })

        expect(res.status).toBe(403)
      })

      test('ADMIN ロールのユーザーを対象にすると 403 を返す', async () => {
        const admin = await createTestUser()
        await createAdminUser(admin.token, admin.userId)
        const anotherAdmin = await createTestUser()
        await createAdminUser(anotherAdmin.token, anotherAdmin.userId)

        const res = await app.request('/api/v1/user/admin/plan', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${admin.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUserId: anotherAdmin.userId,
            plan: 'PREMIUM',
          }),
        })

        expect(res.status).toBe(403)
      })
    })
  })
})
