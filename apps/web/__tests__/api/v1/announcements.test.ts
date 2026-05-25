import { afterEach, describe, expect, test, vi } from 'vitest'
import { prisma } from '@repo/database'
import { createTestUser, testAuthRequired } from '../../helpers/authHelper'
import {
  createAdminUser,
  createTestAnnouncement,
  publishTestAnnouncement,
} from '../../helpers/notificationHelper'
import { app } from '@/lib/api/server/app'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Announcements API Endpoints (一般ユーザー)', () => {
  describe('GET /api/v1/announcements', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/announcements', 'GET')
    })

    test('PUBLISHED のアナウンスのみ返る', async () => {
      const admin = await createTestUser()
      await createAdminUser(admin.token, admin.userId)

      // DRAFT 作成
      const draftId = await createTestAnnouncement(admin.userId, {
        title: 'ドラフト',
      })
      // PUBLISHED 作成
      const publishedId = await createTestAnnouncement(admin.userId, {
        title: '公開済み',
      })
      await publishTestAnnouncement(publishedId)

      const user = await createTestUser()
      const res = await app.request('/api/v1/announcements', {
        headers: { Authorization: `Bearer ${user.token}` },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      const ids = json.data.announcements.map(
        (a: { announcementId: string }) => a.announcementId
      )
      expect(ids).toContain(publishedId)
      expect(ids).not.toContain(draftId)
    })

    test('自分の既読状態が返る', async () => {
      const admin = await createTestUser()
      await createAdminUser(admin.token, admin.userId)
      const announcementId = await createTestAnnouncement(admin.userId)
      await publishTestAnnouncement(announcementId)

      const user = await createTestUser()

      // 既読前
      const before = await app.request('/api/v1/announcements', {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const beforeJson = await before.json()
      const beforeItem = beforeJson.data.announcements.find(
        (a: { announcementId: string }) => a.announcementId === announcementId
      )
      expect(beforeItem.isRead).toBe(false)

      // 既読記録
      await app.request(`/api/v1/announcements/${announcementId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` },
      })

      // 既読後
      const after = await app.request('/api/v1/announcements', {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const afterJson = await after.json()
      const afterItem = afterJson.data.announcements.find(
        (a: { announcementId: string }) => a.announcementId === announcementId
      )
      expect(afterItem.isRead).toBe(true)
    })
  })

  describe('PATCH /api/v1/announcements/:id/read', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/announcements/dummy-id/read', 'PATCH')
    })

    test('既読記録が冪等である (2回呼んでもエラーにならない)', async () => {
      const admin = await createTestUser()
      await createAdminUser(admin.token, admin.userId)
      const announcementId = await createTestAnnouncement(admin.userId)
      await publishTestAnnouncement(announcementId)

      const user = await createTestUser()
      const req = () =>
        app.request(`/api/v1/announcements/${announcementId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${user.token}` },
        })

      const res1 = await req()
      const res2 = await req()

      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)

      // DBに重複レコードがないことを確認
      const count = await prisma.tSystemAnnouncementRead.count({
        where: { announcementId, userId: user.userId },
      })
      expect(count).toBe(1)
    })

    test('PUBLISHED でないアナウンスの既読はエラーになる', async () => {
      const admin = await createTestUser()
      await createAdminUser(admin.token, admin.userId)
      const draftId = await createTestAnnouncement(admin.userId)

      const user = await createTestUser()
      const res = await app.request(`/api/v1/announcements/${draftId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` },
      })

      expect(res.status).toBe(404)
    })
  })
})
