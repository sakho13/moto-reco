import { afterEach, describe, expect, test, vi } from 'vitest'
import { createTestUser, testAuthRequired } from '../../../helpers/authHelper'
import {
  createAdminUser,
  createTestAnnouncement,
} from '../../../helpers/notificationHelper'
import { app } from '@/lib/api/server/app'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Admin Announcements API Endpoints', () => {
  describe('POST /api/v1/admin/announcements', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/admin/announcements', 'POST', {
        type: 'SYSTEM_MAINTENANCE',
        title: 'test',
        body: 'test',
      })
    })

    test('USER ロールでは 403 になる', async () => {
      const user = await createTestUser()

      const res = await app.request('/api/v1/admin/announcements', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'SYSTEM_MAINTENANCE',
          title: 'test',
          body: 'test',
        }),
      })

      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.errorCode).toBe('FORBIDDEN')
    })

    test('ADMIN ロールでアナウンスを作成できる', async () => {
      const admin = await createTestUser()
      await createAdminUser(admin.token, admin.userId)

      const res = await app.request('/api/v1/admin/announcements', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${admin.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'SYSTEM_MAINTENANCE',
          title: 'メンテナンスのお知らせ',
          body: '明日0:00-3:00の間メンテナンスを行います',
        }),
      })

      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.data.announcementId).toBeDefined()
    })

    test('タイトルが空の場合はバリデーションエラーになる', async () => {
      const admin = await createTestUser()
      await createAdminUser(admin.token, admin.userId)

      const res = await app.request('/api/v1/admin/announcements', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${admin.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'SYSTEM_MAINTENANCE',
          title: '',
          body: 'test',
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/admin/announcements', () => {
    test('USER ロールでは 403 になる', async () => {
      const user = await createTestUser()

      const res = await app.request('/api/v1/admin/announcements', {
        headers: { Authorization: `Bearer ${user.token}` },
      })

      expect(res.status).toBe(403)
    })

    test('ADMIN は全ステータスのアナウンスを取得できる', async () => {
      const admin = await createTestUser()
      await createAdminUser(admin.token, admin.userId)
      await createTestAnnouncement(admin.token, { title: '管理一覧テスト' })

      const res = await app.request('/api/v1/admin/announcements', {
        headers: { Authorization: `Bearer ${admin.token}` },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.announcements.length).toBeGreaterThanOrEqual(1)
      // readCount フィールドが含まれる
      expect(json.data.announcements[0].readCount).toBeDefined()
    })
  })

  describe('POST /api/v1/admin/announcements/:id/publish', () => {
    test('DRAFT を公開できる', async () => {
      const admin = await createTestUser()
      await createAdminUser(admin.token, admin.userId)
      const announcementId = await createTestAnnouncement(admin.token)

      const res = await app.request(
        `/api/v1/admin/announcements/${announcementId}/publish`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${admin.token}` },
        }
      )

      expect(res.status).toBe(200)

      // 詳細で publishedAt が設定されていることを確認
      const detail = await app.request(
        `/api/v1/admin/announcements/${announcementId}`,
        { headers: { Authorization: `Bearer ${admin.token}` } }
      )
      const detailJson = await detail.json()
      expect(detailJson.data.status).toBe('PUBLISHED')
      expect(detailJson.data.publishedAt).not.toBeNull()
    })

    test('すでに PUBLISHED のアナウンスを再公開するとエラーになる', async () => {
      const admin = await createTestUser()
      await createAdminUser(admin.token, admin.userId)
      const announcementId = await createTestAnnouncement(admin.token)
      await app.request(
        `/api/v1/admin/announcements/${announcementId}/publish`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${admin.token}` },
        }
      )

      const res = await app.request(
        `/api/v1/admin/announcements/${announcementId}/publish`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${admin.token}` },
        }
      )

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/v1/admin/announcements/:id/expire', () => {
    test('PUBLISHED を失効にできる', async () => {
      const admin = await createTestUser()
      await createAdminUser(admin.token, admin.userId)
      const announcementId = await createTestAnnouncement(admin.token)
      await app.request(
        `/api/v1/admin/announcements/${announcementId}/publish`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${admin.token}` },
        }
      )

      const res = await app.request(
        `/api/v1/admin/announcements/${announcementId}/expire`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${admin.token}` },
        }
      )

      expect(res.status).toBe(200)

      const detail = await app.request(
        `/api/v1/admin/announcements/${announcementId}`,
        { headers: { Authorization: `Bearer ${admin.token}` } }
      )
      const detailJson = await detail.json()
      expect(detailJson.data.status).toBe('EXPIRED')
    })
  })

  describe('既読数', () => {
    test('ユーザーが既読すると readCount が増える', async () => {
      const admin = await createTestUser()
      await createAdminUser(admin.token, admin.userId)
      const announcementId = await createTestAnnouncement(admin.token)
      await app.request(
        `/api/v1/admin/announcements/${announcementId}/publish`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${admin.token}` },
        }
      )

      const user = await createTestUser()
      await app.request(`/api/v1/announcements/${announcementId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` },
      })

      const detail = await app.request(
        `/api/v1/admin/announcements/${announcementId}`,
        { headers: { Authorization: `Bearer ${admin.token}` } }
      )
      const detailJson = await detail.json()
      expect(detailJson.data.readCount).toBe(1)
    })
  })
})
