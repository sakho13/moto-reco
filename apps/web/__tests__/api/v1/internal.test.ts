import { afterEach, describe, expect, test, vi } from 'vitest'
import { prisma } from '@repo/database'
import { ResendEmailRepository } from '@repo/email'
import { createTestUser } from '../../helpers/authHelper'
import { createAdminUser } from '../../helpers/notificationHelper'
import { app } from '@/lib/api/server/app'

// Storageは実体を持たないためモック化する。Firebase Authは既存のヘルパーが
// 依存するトークン検証（verifyIdToken）と同一クライアントを共有しているため、
// モックせずFirebase Auth Emulatorへ実際にdeleteUserを実行させる。
vi.mock('@/lib/firebase/adminStorage', () => ({
  getFirebaseAdminStorage: () => ({
    bucket: () => ({
      file: () => ({
        delete: vi.fn().mockResolvedValue([{}]),
      }),
    }),
  }),
  getStorageBucketName: () => 'test-bucket',
}))

/** 管理者としてシステムAPIキーを1件発行し、平文フルキーを返す */
async function issueSystemApiKey(): Promise<string> {
  const { token, userId } = await createTestUser()
  await createAdminUser(token, userId)

  const res = await app.request('/api/v1/admin/system-api-keys', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'internal test key' }),
  })
  const json = await res.json()
  return json.data.fullKey as string
}

describe('POST /api/v1/internal/purge-quit-users', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
    const res = await app.request('/api/v1/internal/purge-quit-users', {
      method: 'POST',
    })

    const json = await res.json()
    expect(json.status).toBe('error')
    expect(json.errorCode).toBe('AUTH_FAILED')
    expect(res.status).toBe(401)
  })

  test('無効なシステムAPIキーの場合にエラーとなる', async () => {
    const res = await app.request('/api/v1/internal/purge-quit-users', {
      method: 'POST',
      headers: { Authorization: 'Bearer sk_invalid_key' },
    })

    const json = await res.json()
    expect(json.status).toBe('error')
    expect(json.errorCode).toBe('AUTH_FAILED')
    expect(res.status).toBe(401)
  })

  test('有効なシステムAPIキーで、猶予期間超過済みの退会ユーザーを完全削除する', async () => {
    vi.spyOn(ResendEmailRepository.prototype, 'send').mockResolvedValue()

    const systemApiKey = await issueSystemApiKey()

    const { token, userId } = await createTestUser()
    await app.request('/api/v1/user/auth/quit', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quitReason: 'テスト退会理由' }),
    })

    // 猶予期間を過去日時に書き換えてバッチ対象にする
    await prisma.tUserQuit.update({
      where: { userId },
      data: { purgeAt: new Date('2000-01-01T00:00:00Z') },
    })

    const res = await app.request('/api/v1/internal/purge-quit-users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${systemApiKey}` },
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('success')
    expect(json.data.succeededUserIds).toContain(userId)
    expect(json.data.failedUserIds).not.toContain(userId)

    const userRecord = await prisma.mUser.findUnique({
      where: { id: userId },
    })
    expect(userRecord).toBeNull()
  })

  test('猶予期間内の退会ユーザーは削除対象に含まれない', async () => {
    vi.spyOn(ResendEmailRepository.prototype, 'send').mockResolvedValue()

    const systemApiKey = await issueSystemApiKey()

    const { token, userId } = await createTestUser()
    await app.request('/api/v1/user/auth/quit', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quitReason: 'テスト退会理由' }),
    })
    // purgeAtは退会30日後のままなので、まだ猶予期間内

    const res = await app.request('/api/v1/internal/purge-quit-users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${systemApiKey}` },
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.succeededUserIds).not.toContain(userId)
    expect(json.data.failedUserIds).not.toContain(userId)

    const userRecord = await prisma.mUser.findUnique({
      where: { id: userId },
    })
    expect(userRecord).not.toBeNull()
  })
})
