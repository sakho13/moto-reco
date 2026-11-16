import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { BikeSearchParams } from '@repo/shared-domain'
import {
  ApiResponseManufacturer,
  ApiResponseBikeSearch,
  BikeSearchQuerySchema,
  SuccessResponse,
} from '@repo/shared-types'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateQuery } from '../middlewares/zodValidation'
import { PrismaBikeRepository } from '../repositories/PrismaBikeRepository'
import { PrismaCompanyRepository } from '../repositories/PrismaCompanyRepository'

const bikes = new Hono()

bikes.get('/manufacturers', honoAuthMiddleware, async (c) => {
  const companyRepo = new PrismaCompanyRepository(prisma)

  const manufacturers = await companyRepo.findAll({ category: 'BIKE_MAKER' })

  return c.json<SuccessResponse<ApiResponseManufacturer>>({
    status: 'success',
    data: {
      manufacturers: manufacturers.map((m) => ({
        manufacturerId: m.id,
        name: m.name,
        nameEn: m.nameEn ?? '',
        country: m.country ?? '',
      })),
    },
    message: 'メーカー一覧取得成功',
  })
})

bikes.get(
  '/search',
  honoAuthMiddleware,
  zodValidateQuery(BikeSearchQuerySchema),
  async (c) => {
    const query = c.req.valid('query')

    // 検証済みのクエリパラメータからBikeSearchParamsを生成
    const searchParams = new BikeSearchParams({
      manufacturerOperator: query['mf-op'],
      manufacturerIds: query.mf ? query.mf.split(',') : undefined,
      modelName: query['model-name'],
      displacementMin: query['displacement-min'],
      displacementMax: query['displacement-max'],
      modelYearMin: query['model-year-min'],
      modelYearMax: query['model-year-max'],
      page: query.page,
      pageSize: query['page-size'],
      sortBy: query['sort-by'],
      sortOrder: query['sort-order'],
    })

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
  }
)

export default bikes
