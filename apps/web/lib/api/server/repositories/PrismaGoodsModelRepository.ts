import { Prisma } from '@repo/database'
import {
  createCompanyId,
  createGoodsModelId,
  GoodsModelId,
} from '@repo/shared-types'
import { GoodsModelEntity } from '../entities/GoodsModelEntity'
import { IGoodsModelRepository } from '../interfaces/IGoodsModelRepository'
import { GoodsModelSearchParams } from '../valueObjects/GoodsModelSearchParams'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaGoodsModelRepository
  extends PrismaRepositoryBase
  implements IGoodsModelRepository
{
  async search(params: GoodsModelSearchParams): Promise<GoodsModelEntity[]> {
    const where: Prisma.MGoodsModelWhereInput = { isActive: true }

    if (params.manufacturerId) {
      where.goodsManufacturerId = params.manufacturerId
    }

    if (params.category) {
      where.category = params.category
    }

    if (params.keyword) {
      where.OR = [
        { name: { contains: params.keyword, mode: 'insensitive' } },
        { modelNumber: { contains: params.keyword, mode: 'insensitive' } },
      ]
    }

    const models = await this.connection.mGoodsModel.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: params.skip,
      take: params.take,
      include: {
        manufacturer: true,
      },
    })

    return models.map(
      (model) =>
        new GoodsModelEntity({
          id: createGoodsModelId(model.id),
          goodsManufacturerId: createCompanyId(model.goodsManufacturerId),
          manufacturerName: model.manufacturer.name,
          modelNumber: model.modelNumber,
          name: model.name,
          category: model.category,
          amazonAsin: model.amazonAsin,
          rakutenItemId: model.rakutenItemId,
          officialUrl: model.officialUrl,
        })
    )
  }

  async findById(goodsModelId: GoodsModelId): Promise<GoodsModelEntity | null> {
    const model = await this.connection.mGoodsModel.findFirst({
      where: { id: goodsModelId, isActive: true },
      include: {
        manufacturer: true,
      },
    })

    if (!model) {
      return null
    }

    return new GoodsModelEntity({
      id: createGoodsModelId(model.id),
      goodsManufacturerId: createCompanyId(model.goodsManufacturerId),
      manufacturerName: model.manufacturer.name,
      modelNumber: model.modelNumber,
      name: model.name,
      category: model.category,
      amazonAsin: model.amazonAsin,
      rakutenItemId: model.rakutenItemId,
      officialUrl: model.officialUrl,
    })
  }
}
