import { describe, expect, test } from 'vitest'
import app from '../../../server'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import { handleRegisterByFirebase } from '../../helpers/firebaseTestToken'

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
})
