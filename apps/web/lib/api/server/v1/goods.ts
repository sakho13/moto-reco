import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseGoodsManufacturer,
  ApiResponseGoodsModelSearch,
  GoodsModelSearchQuerySchema,
  SuccessResponse,
} from '@repo/shared-types'
import { honoAdminMiddleware } from '../middlewares/honoAdmin'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateQuery } from '../middlewares/zodValidation'
import { PrismaCompanyRepository } from '../repositories/PrismaCompanyRepository'
import { PrismaGoodsModelRepository } from '../repositories/PrismaGoodsModelRepository'
import { GoodsModelSearchParams } from '../valueObjects/GoodsModelSearchParams'

const goods = new Hono()

goods.get(
  '/manufacturers',
  honoAuthMiddleware,
  honoAdminMiddleware,
  async (c) => {
    const companyRepo = new PrismaCompanyRepository(prisma)

    const manufacturers = (
      await companyRepo.findAll({ category: 'GOODS_MANUFACTURER' })
    ).filter((m) => m.isActive)

    return c.json<SuccessResponse<ApiResponseGoodsManufacturer>>({
      status: 'success',
      data: {
        manufacturers: manufacturers.map((m) => ({
          goodsManufacturerId: m.id,
          name: m.name,
          nameEn: m.nameEn,
        })),
      },
      message: 'グッズメーカー一覧取得成功',
    })
  }
)

goods.get(
  '/models',
  honoAuthMiddleware,
  honoAdminMiddleware,
  zodValidateQuery(GoodsModelSearchQuerySchema),
  async (c) => {
    const query = c.req.valid('query')

    const searchParams = new GoodsModelSearchParams({
      manufacturerId: query.manufacturerId,
      category: query.category,
      keyword: query.keyword,
      page: query.page,
      pageSize: query['per-size'],
    })

    const modelRepo = new PrismaGoodsModelRepository(prisma)
    const models = await modelRepo.search(searchParams)

    return c.json<SuccessResponse<ApiResponseGoodsModelSearch>>({
      status: 'success',
      data: {
        models: models.map((model) => ({
          goodsModelId: model.id,
          goodsManufacturerId: model.goodsManufacturerId,
          manufacturerName: model.manufacturerName,
          modelNumber: model.modelNumber,
          name: model.name,
          category: model.category,
          amazonUrl: model.amazonUrl,
          rakutenUrl: model.rakutenUrl,
          officialUrl: model.officialUrl,
        })),
      },
      message: 'グッズ型番検索成功',
    })
  }
)

export default goods
