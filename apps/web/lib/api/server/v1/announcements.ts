import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseAnnouncementList,
  SuccessResponse,
} from '@repo/shared-types'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { PrismaAnnouncementRepository } from '../repositories/PrismaAnnouncementRepository'
import { AnnouncementService } from '../services/AnnouncementService'
import { HonoVariables } from '../types/hono'

const announcements = new Hono<{ Variables: HonoVariables }>()

announcements.get('/', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!
  const service = new AnnouncementService(
    new PrismaAnnouncementRepository(prisma)
  )
  const result = await service.getPublishedAnnouncements(userId)
  return c.json<SuccessResponse<ApiResponseAnnouncementList>>({
    status: 'success',
    data: { announcements: result },
  })
})

announcements.patch('/read-all', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!
  const service = new AnnouncementService(
    new PrismaAnnouncementRepository(prisma)
  )
  await service.markAllAsRead(userId)
  return c.json<SuccessResponse<null>>({
    status: 'success',
    data: null,
    message: '全て既読にしました',
  })
})

announcements.patch('/:id/read', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!
  const id = c.req.param('id')
  const service = new AnnouncementService(
    new PrismaAnnouncementRepository(prisma)
  )
  await service.markAsRead(id, userId)
  return c.json<SuccessResponse<null>>({
    status: 'success',
    data: null,
    message: '既読にしました',
  })
})

export default announcements
