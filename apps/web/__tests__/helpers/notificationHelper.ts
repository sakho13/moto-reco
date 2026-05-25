import { prisma } from '@repo/database'

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
 * システムアナウンスをDBで直接公開する
 */
export async function publishTestAnnouncement(id: string): Promise<void> {
  await prisma.mSystemAnnouncement.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  })
}

/**
 * システムアナウンスをDBに直接作成する
 */
export async function createTestAnnouncement(
  _token: string,
  options: {
    type?: string
    title?: string
    body?: string
  } = {}
): Promise<string> {
  const record = await prisma.mSystemAnnouncement.create({
    data: {
      type: (options.type ?? 'SYSTEM_MAINTENANCE') as never,
      title: options.title ?? 'テストアナウンス',
      body: options.body ?? 'テストアナウンスの本文',
      createdBy: 'test-admin',
    },
  })
  return record.id
}
