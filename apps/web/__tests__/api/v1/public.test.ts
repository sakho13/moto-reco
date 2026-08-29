import { afterEach, describe, expect, test, vi } from 'vitest'
import { prisma } from '@repo/database'
import { createTestUser } from '../../helpers/authHelper'
import {
  createAdminUser,
  createTestAnnouncement,
  publishTestAnnouncement,
} from '../../helpers/notificationHelper'
import { app } from '@/lib/api/server/app'

afterEach(async () => {
  vi.restoreAllMocks()
  await prisma.tSystemAnnouncementRead.deleteMany()
  await prisma.mSystemAnnouncement.deleteMany()
})

describe('Public API Endpoints', () => {
  describe('GET /api/v1/public/moped-test/questions', () => {
    test('原付学科試験の問題セットを取得できる', async () => {
      const res = await app.request('/api/v1/public/moped-test/questions', {
        method: 'GET',
      })

      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.message).toBe('原付学科試験の問題取得成功')
      expect(json.data.title).toBe('原付学科試験 練習問題')
      expect(json.data.questionCount).toBeGreaterThan(0)
      expect(json.data.questions.length).toBe(json.data.questionCount)
      expect(json.data.questions[0]).toMatchObject({
        questionId: expect.any(String),
        statement: expect.any(String),
        category: expect.any(String),
        correctAnswer: expect.stringMatching(/^(true|false)$/),
        explanation: expect.any(String),
      })
    })
  })

  describe('GET /api/v1/public/release-notes', () => {
    test('認証なしでPUBLISHEDのリリースノートのみ取得できる', async () => {
      const admin = await createTestUser()
      await createAdminUser(admin.token, admin.userId)

      const draftId = await createTestAnnouncement(admin.userId, {
        type: 'RELEASE_ANNOUNCEMENT',
        title: '下書き',
        version: '0.0.1',
      })
      const publishedId = await createTestAnnouncement(admin.userId, {
        type: 'RELEASE_ANNOUNCEMENT',
        title: '軽微な修正',
        version: '0.0.2',
      })
      await publishTestAnnouncement(publishedId)
      // システムメンテナンスは混ざらないこと
      const maintenanceId = await createTestAnnouncement(admin.userId, {
        type: 'SYSTEM_MAINTENANCE',
      })
      await publishTestAnnouncement(maintenanceId)

      const res = await app.request('/api/v1/public/release-notes')
      const json = await res.json()

      expect(res.status).toBe(200)
      const ids = json.data.releaseNotes.map(
        (r: { announcementId: string }) => r.announcementId
      )
      expect(ids).toContain(publishedId)
      expect(ids).not.toContain(draftId)
      expect(ids).not.toContain(maintenanceId)

      const published = json.data.releaseNotes.find(
        (r: { announcementId: string }) => r.announcementId === publishedId
      )
      expect(published).toMatchObject({
        version: '0.0.2',
        title: '軽微な修正',
      })
    })
  })
})
