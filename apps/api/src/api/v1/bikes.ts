import { Hono } from 'hono'
import { prisma } from '@packages/database'
import { ApiResponseManufacturer, SuccessResponse } from '@shared-types/index'
import { PrismaManufacturerRepository } from '../../lib/classes/repositories/PrismaManufacturerRepository'
import { honoAuthMiddleware } from '../../lib/middlewares/honoAuth'

const bikes = new Hono()

bikes.get('/manufacturers', honoAuthMiddleware, async (c) => {
  const manufacturerRepo = new PrismaManufacturerRepository(prisma)

  const manufacturers = await manufacturerRepo.findAll()

  return c.json<SuccessResponse<ApiResponseManufacturer>>({
    status: 'success',
    data: {
      manufacturers: manufacturers.map((m) => ({
        manufacturerId: m.id,
        name: m.name,
        nameEn: m.nameEn,
        country: m.country,
      })),
    },
    message: 'メーカー一覧取得成功',
  })
})

bikes.get('/search', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!

  return c.json({})
})

export default bikes
