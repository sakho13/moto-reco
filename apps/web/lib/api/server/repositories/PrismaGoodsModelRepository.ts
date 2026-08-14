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

    // 検索条件（メーカー・カテゴリ・キーワード）が一つも指定されていない場合は
    // 販売開始日の新しい順（未設定は末尾）、それ以外は商品名の昇順で並べる
    const isUnfiltered =
      !params.manufacturerId && !params.category && !params.keyword
    const orderBy: Prisma.MGoodsModelOrderByWithRelationInput = isUnfiltered
      ? { releaseDate: { sort: 'desc', nulls: 'last' } }
      : { name: 'asc' }

    const models = await this.connection.mGoodsModel.findMany({
      where,
      orderBy,
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
          imageUrl: model.imageUrl,
          description: model.description,
          releaseDate: model.releaseDate,
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
      imageUrl: model.imageUrl,
      description: model.description,
      releaseDate: model.releaseDate,
      amazonAsin: model.amazonAsin,
      rakutenItemId: model.rakutenItemId,
      officialUrl: model.officialUrl,
    })
  }
}
