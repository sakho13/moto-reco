import { prisma } from '@repo/database'
import { app } from '@/lib/api/server/app'

/**
 * テストユーザーの TNotification を直接DBに作成する
 */
export async function createTestNotification(
  userId: string,
  options: {
    type?: string
    title?: string
    body?: string
    isRead?: boolean
    metadata?: Record<string, unknown>
  } = {}
): Promise<string> {
  const record = await prisma.tNotification.create({
    data: {
      userId,
      type: (options.type ?? 'FOLLOWED') as never,
      title: options.title ?? 'テスト通知',
      body: options.body ?? 'テスト通知の本文',
      isRead: options.isRead ?? false,
      metadata: options.metadata ?? undefined,
    },
  })
  return record.id
}

/**
 * ADMIN ロールのテストユーザーを作成してトークンを取得する
 */
export async function createAdminUser(
  token: string,
  userId: string
): Promise<void> {
  await prisma.mUser.update({
    where: { id: userId },
    data: { role: 'ADMIN' },
  })
}

/**
 * システムアナウンスを管理者APIで作成する
 */
export async function createTestAnnouncement(
  token: string,
  options: {
    type?: string
    title?: string
    body?: string
  } = {}
): Promise<string> {
  const res = await app.request('/api/v1/admin/announcements', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: options.type ?? 'SYSTEM_MAINTENANCE',
      title: options.title ?? 'テストアナウンス',
      body: options.body ?? 'テストアナウンスの本文',
    }),
  })
  const json = await res.json()
  return json.data.announcementId
}
