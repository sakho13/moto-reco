import { describe, expect, test } from 'vitest'
import { prisma } from '@repo/database'
import { createTestUser, testAuthRequired } from '../../helpers/authHelper'
import { createAdminUser } from '../../helpers/notificationHelper'
import { app } from '@/lib/api/server/app'

describe('System API Keys Admin Endpoints', () => {
  describe('GET /api/v1/admin/system-api-keys', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/admin/system-api-keys', 'GET')
    })

    test('ADMIN以外はFORBIDDENエラーとなる', async () => {
      const { token } = await createTestUser()

      const res = await app.request('/api/v1/admin/system-api-keys', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('FORBIDDEN')
      expect(res.status).toBe(403)
    })

    test('ADMINは一覧を取得できる', async () => {
      const { token, userId } = await createTestUser()
      await createAdminUser(token, userId)

      const res = await app.request('/api/v1/admin/system-api-keys', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.status).toBe('success')
      expect(Array.isArray(json.data.systemApiKeys)).toBe(true)
    })
  })

  describe('POST /api/v1/admin/system-api-keys', () => {
    test('ADMIN以外はFORBIDDENエラーとなる', async () => {
      const { token } = await createTestUser()

      const res = await app.request('/api/v1/admin/system-api-keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'test key' }),
      })

      const json = await res.json()
      expect(json.errorCode).toBe('FORBIDDEN')
      expect(res.status).toBe(403)
    })

    test('ADMINはシステムAPIキーを発行できる（fullKeyはsk_プレフィックス）', async () => {
      const { token, userId } = await createTestUser()
      await createAdminUser(token, userId)

      const res = await app.request('/api/v1/admin/system-api-keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'purge batch key' }),
      })

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.status).toBe('success')
      expect(json.data.fullKey).toMatch(/^sk_/)
      expect(json.data.isActive).toBe(true)

      const record = await prisma.mSystemApiKey.findUnique({
        where: { id: json.data.systemApiKeyId },
      })
      expect(record).not.toBeNull()
      expect(record?.name).toBe('purge batch key')
    })
  })

  describe('PATCH /api/v1/admin/system-api-keys/:id', () => {
    test('ADMINはisActiveを失効に切り替えられる', async () => {
      const { token, userId } = await createTestUser()
      await createAdminUser(token, userId)

      const createRes = await app.request('/api/v1/admin/system-api-keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'to be revoked' }),
      })
      const createJson = await createRes.json()

      const res = await app.request(
        `/api/v1/admin/system-api-keys/${createJson.data.systemApiKeyId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive: false }),
        }
      )

      expect(res.status).toBe(200)

      const record = await prisma.mSystemApiKey.findUnique({
        where: { id: createJson.data.systemApiKeyId },
      })
      expect(record?.isActive).toBe(false)
    })
  })
})
