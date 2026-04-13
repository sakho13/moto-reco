import { expect } from 'vitest'
import { createRandomEmail } from './createRandomEmail'
import {
  handleAnonymousSignInByFirebase,
  handleLinkAnonymousWithEmail,
  handleRegisterByFirebase,
} from './firebaseTestToken'
import { app } from '@/lib/api/server/app'

/**
 * 新規ユーザーを作成してトークンを取得する
 */
export async function createTestUser(): Promise<{
  token: string
  userId: string
  email: string
}> {
  const email = createRandomEmail()
  const credential = await handleRegisterByFirebase(email, 'password')
  const token = await credential.user.getIdToken()

  const registerRes = await app.request('/api/v1/user/auth/register', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `テストユーザー_${Date.now()}`,
    }),
  })

  const registerJson = await registerRes.json()
  const userId = registerJson.data.userId

  return { token, userId, email }
}

/**
 * ゲストユーザーを作成してトークンを取得する
 */
export async function createGuestUser(): Promise<{
  token: string
  userId: string
}> {
  const credential = await handleAnonymousSignInByFirebase()
  const token = await credential.user.getIdToken()

  const registerRes = await app.request('/api/v1/user/auth/guest/register', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  const registerJson = await registerRes.json()
  const userId = registerJson.data.userId

  return { token, userId }
}

/**
 * ゲストユーザーを作成してアップグレード（メール連携）する
 */
export async function upgradeGuestUserWithEmail(guestToken: string): Promise<{
  token: string
  userId: string
  email: string
}> {
  // まずゲスト登録
  const registerRes = await app.request('/api/v1/user/auth/guest/register', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${guestToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  const registerJson = await registerRes.json()
  const userId = registerJson.data.userId

  // Firebase Account Linking（匿名→メール）
  const email = createRandomEmail()
  const linkedCredential = await handleLinkAnonymousWithEmail(email, 'password')
  const token = await linkedCredential.user.getIdToken()

  // アップグレードAPI呼び出し
  await app.request('/api/v1/user/auth/guest/upgrade', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  return { token, userId, email }
}

/**
 * 認証エラーのテストを実行する共通関数
 */
export async function testAuthRequired(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<void> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const res = await app.request(endpoint, options)
  const json = await res.json()

  expect(res.status).toBe(401)
  expect(json).toEqual({
    status: 'error',
    errorCode: 'AUTH_FAILED',
    message: expect.any(String),
  })
}
