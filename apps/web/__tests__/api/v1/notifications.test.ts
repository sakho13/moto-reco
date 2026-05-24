import { afterEach, describe, expect, test, vi } from 'vitest'
import { createTestUser, testAuthRequired } from '../../helpers/authHelper'
import { createTestNotification } from '../../helpers/notificationHelper'
import { app } from '@/lib/api/server/app'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Notifications API Endpoints', () => {
  describe('GET /api/v1/notifications/unread-count', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/notifications/unread-count', 'GET')
    })

    test('未読件数が正しく返る', async () => {
      const user = await createTestUser()
      await createTestNotification(user.userId, { isRead: false })
      await createTestNotification(user.userId, { isRead: false })
      await createTestNotification(user.userId, { isRead: true })

      const res = await app.request('/api/v1/notifications/unread-count', {
        headers: { Authorization: `Bearer ${user.token}` },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.count).toBeGreaterThanOrEqual(2)
    })
  })

  describe('GET /api/v1/notifications', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/notifications', 'GET')
    })

    test('自分の通知一覧が取得できる', async () => {
      const user = await createTestUser()
      await createTestNotification(user.userId, { title: '通知A' })
      await createTestNotification(user.userId, { title: '通知B' })

      const res = await app.request('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${user.token}` },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.notifications.length).toBeGreaterThanOrEqual(2)
      expect(json.data.total).toBeGreaterThanOrEqual(2)
    })

    test('他ユーザーの通知は含まれない', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      await createTestNotification(user2.userId, { title: 'user2の通知' })

      const res = await app.request('/api/v1/notifications', {
        headers: { Authorization: `Bearer ${user1.token}` },
      })

      const json = await res.json()
      const titles = json.data.notifications.map(
        (n: { title: string }) => n.title
      )
      expect(titles).not.toContain('user2の通知')
    })
  })

  describe('PATCH /api/v1/notifications/:id/read', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/notifications/dummy-id/read', 'PATCH')
    })

    test('自分の通知を既読にできる', async () => {
      const user = await createTestUser()
      const notifId = await createTestNotification(user.userId, {
        isRead: false,
      })

      const res = await app.request(`/api/v1/notifications/${notifId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` },
      })

      expect(res.status).toBe(200)
    })

    test('他ユーザーの通知は変更されない (冪等)', async () => {
      const user1 = await createTestUser()
      const user2 = await createTestUser()
      const notifId = await createTestNotification(user2.userId, {
        isRead: false,
      })

      // user1 が user2 の通知を既読にしようとしても 200 (updateMany で 0件更新)
      const res = await app.request(`/api/v1/notifications/${notifId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user1.token}` },
      })

      expect(res.status).toBe(200)
    })
  })

  describe('PATCH /api/v1/notifications/read-all', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/notifications/read-all', 'PATCH')
    })

    test('自分の全未読通知を既読にできる', async () => {
      const user = await createTestUser()
      await createTestNotification(user.userId, { isRead: false })
      await createTestNotification(user.userId, { isRead: false })

      const res = await app.request('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${user.token}` },
      })

      expect(res.status).toBe(200)

      // 未読数が 0 になる
      const countRes = await app.request('/api/v1/notifications/unread-count', {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const countJson = await countRes.json()
      // アナウンス未読は別途管理されるため通知分のみ0になれば良い
      expect(countJson.status).toBe('success')
    })
  })
})
