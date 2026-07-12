import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseNotificationList,
  ApiResponseNotificationUnreadCount,
  SuccessResponse,
} from '@repo/shared-types'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { PrismaAnnouncementRepository } from '../repositories/PrismaAnnouncementRepository'
import { PrismaNotificationRepository } from '../repositories/PrismaNotificationRepository'
import { AnnouncementService } from '../services/AnnouncementService'
import { NotificationService } from '../services/NotificationService'
import { HonoVariables } from '../types/hono'

const notifications = new Hono<{ Variables: HonoVariables }>()

notifications.get('/unread-count', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!
  const notifService = new NotificationService(
    new PrismaNotificationRepository(prisma)
  )
  const announceService = new AnnouncementService(
    new PrismaAnnouncementRepository(prisma)
  )
  const [notifCount, announceCount] = await Promise.all([
    notifService.countUnread(userEntity.id),
    announceService.countUnread(userEntity.id),
  ])
  return c.json<SuccessResponse<ApiResponseNotificationUnreadCount>>({
    status: 'success',
    data: { count: notifCount + announceCount },
  })
})

notifications.get('/', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!
  const pageParam = Number(c.req.query('page') ?? '1')
  const page = Number.isInteger(pageParam) && pageParam >= 1 ? pageParam : 1
  const service = new NotificationService(
    new PrismaNotificationRepository(prisma)
  )
  const result = await service.getNotifications(userEntity.id, page)
  return c.json<SuccessResponse<ApiResponseNotificationList>>({
    status: 'success',
    data: result,
  })
})

notifications.patch('/:id/read', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!
  const id = c.req.param('id')
  const service = new NotificationService(
    new PrismaNotificationRepository(prisma)
  )
  await service.markAsRead(id, userEntity.id)
  return c.json<SuccessResponse<null>>({
    status: 'success',
    data: null,
    message: '既読にしました',
  })
})

notifications.patch('/read-all', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!
  const service = new NotificationService(
    new PrismaNotificationRepository(prisma)
  )
  await service.markAllAsRead(userEntity.id)
  return c.json<SuccessResponse<null>>({
    status: 'success',
    data: null,
    message: '全て既読にしました',
  })
})

export default notifications
