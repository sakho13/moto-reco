import { Hono } from 'hono'
import { prisma } from '@packages/database'
import {
  ApiResponseManufacturer,
  ApiResponseBikeSearch,
  SuccessResponse,
} from '@shared-types/index'
import { PrismaBikeRepository } from '../../lib/classes/repositories/PrismaBikeRepository'
import { PrismaManufacturerRepository } from '../../lib/classes/repositories/PrismaManufacturerRepository'
import { BikeSearchParams } from '../../lib/classes/valueObjects/BikeSearchParams'
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
  const query = c.req.query()

  // クエリパラメータからBikeSearchParamsを生成
  const searchParams = BikeSearchParams.fromQueryParams(query)

  const bikeRepo = new PrismaBikeRepository(prisma)
  const bikesResult = await bikeRepo.search(searchParams)

  return c.json<SuccessResponse<ApiResponseBikeSearch>>({
    status: 'success',
    data: {
      bikes: bikesResult.map((bike) => ({
        bikeId: bike.id,
        manufacturerId: bike.manufacturerId,
        manufacturer: bike.manufacturer,
        modelName: bike.modelName,
        displacement: bike.displacement,
        modelYear: bike.modelYear,
      })),
    },
    message: 'バイク検索成功',
  })
})

export default bikes
