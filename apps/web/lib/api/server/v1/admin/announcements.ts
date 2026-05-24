import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  AdminAnnouncementCreateRequestSchema,
  ApiResponseAdminAnnouncementDetail,
  ApiResponseAdminAnnouncementList,
  SuccessResponse,
} from '@repo/shared-types'
import { honoAdminMiddleware } from '../../middlewares/honoAdmin'
import { honoAuthMiddleware } from '../../middlewares/honoAuth'
import { zodValidateJson } from '../../middlewares/zodValidation'
import { PrismaAnnouncementRepository } from '../../repositories/PrismaAnnouncementRepository'
import { AnnouncementService } from '../../services/AnnouncementService'
import { HonoVariables } from '../../types/hono'

const adminAnnouncements = new Hono<{ Variables: HonoVariables }>()

adminAnnouncements.get(
  '/',
  honoAuthMiddleware,
  honoAdminMiddleware,
  async (c) => {
    const service = new AnnouncementService(
      new PrismaAnnouncementRepository(prisma)
    )
    const result = await service.getAllAnnouncements()
    return c.json<SuccessResponse<ApiResponseAdminAnnouncementList>>({
      status: 'success',
      data: { announcements: result },
    })
  }
)

adminAnnouncements.get(
  '/:id',
  honoAuthMiddleware,
  honoAdminMiddleware,
  async (c) => {
    const id = c.req.param('id')
    const service = new AnnouncementService(
      new PrismaAnnouncementRepository(prisma)
    )
    const result = await service.getAnnouncementDetail(id)
    return c.json<SuccessResponse<ApiResponseAdminAnnouncementDetail>>({
      status: 'success',
      data: result,
    })
  }
)

adminAnnouncements.post(
  '/',
  honoAuthMiddleware,
  honoAdminMiddleware,
  zodValidateJson(AdminAnnouncementCreateRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const body = c.req.valid('json')
    const service = new AnnouncementService(
      new PrismaAnnouncementRepository(prisma)
    )
    const result = await service.createAnnouncement(
      {
        type: body.type,
        title: body.title,
        body: body.body,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      },
      userId
    )
    return c.json<SuccessResponse<{ announcementId: string }>>(
      { status: 'success', data: result, message: 'アナウンスを作成しました' },
      201
    )
  }
)

adminAnnouncements.post(
  '/:id/publish',
  honoAuthMiddleware,
  honoAdminMiddleware,
  async (c) => {
    const id = c.req.param('id')
    const service = new AnnouncementService(
      new PrismaAnnouncementRepository(prisma)
    )
    await service.publishAnnouncement(id)
    return c.json<SuccessResponse<null>>({
      status: 'success',
      data: null,
      message: 'アナウンスを公開しました',
    })
  }
)

adminAnnouncements.post(
  '/:id/expire',
  honoAuthMiddleware,
  honoAdminMiddleware,
  async (c) => {
    const id = c.req.param('id')
    const service = new AnnouncementService(
      new PrismaAnnouncementRepository(prisma)
    )
    await service.expireAnnouncement(id)
    return c.json<SuccessResponse<null>>({
      status: 'success',
      data: null,
      message: 'アナウンスを失効しました',
    })
  }
)

export default adminAnnouncements
