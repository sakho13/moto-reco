import { Prisma } from '@packages/database'
import { BikeId, createBikeId } from '@shared-types/index'
import { IBikeRepository } from '../../interfaces/IBikeRepository'
import { PrismaRepositoryBase } from '../common/PrismaRepositoryBase'
import { BikeEntity } from '../entities/BikeEntity'
import { BikeSearchParams } from '../valueObjects/BikeSearchParams'

export class PrismaBikeRepository
  extends PrismaRepositoryBase
  implements IBikeRepository
{
  async findById(bikeId: BikeId): Promise<BikeEntity | null> {
    const bike = await this.connection.mBike.findUnique({
      where: { id: bikeId },
      include: {
        manufacturer: true,
      },
    })

    return bike
      ? new BikeEntity({
          id: createBikeId(bike.id),
          manufacturerId: bike.manufacturerId,
          manufacturer: bike.manufacturer.name,
          modelName: bike.modelName,
          displacement: bike.displacement,
          modelYear: bike.modelYear,
        })
      : null
  }

  async search(params: BikeSearchParams): Promise<BikeEntity[]> {
    const where: Prisma.MBikeWhereInput = {}

    // メーカーIDのフィルタリング
    if (
      params.manufacturerIds &&
      params.manufacturerIds.length > 0 &&
      params.manufacturerOperator
    ) {
      switch (params.manufacturerOperator) {
        case 'eq':
          where.manufacturerId = params.manufacturerIds[0]
          break
        case 'ne':
          where.manufacturerId = { not: params.manufacturerIds[0] }
          break
        case 'in':
          where.manufacturerId = { in: params.manufacturerIds }
          break
      }
    }

    // モデル名の部分一致検索
    if (params.modelName) {
      where.modelName = { contains: params.modelName, mode: 'insensitive' }
    }

    // 排気量の範囲検索
    if (
      params.displacementMin !== undefined ||
      params.displacementMax !== undefined
    ) {
      where.displacement = {}
      if (params.displacementMin !== undefined) {
        where.displacement.gte = params.displacementMin
      }
      if (params.displacementMax !== undefined) {
        where.displacement.lte = params.displacementMax
      }
    }

    // モデル年の範囲検索
    if (
      params.modelYearMin !== undefined ||
      params.modelYearMax !== undefined
    ) {
      where.modelYear = {}
      if (params.modelYearMin !== undefined) {
        where.modelYear.gte = params.modelYearMin
      }
      if (params.modelYearMax !== undefined) {
        where.modelYear.lte = params.modelYearMax
      }
    }

    // ソート設定
    const orderBy: Prisma.MBikeOrderByWithRelationInput = {}
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder
    }

    const bikes = await this.connection.mBike.findMany({
      where,
      orderBy: params.sortBy ? orderBy : undefined,
      skip: params.skip,
      take: params.take,
      include: {
        manufacturer: true,
      },
    })

    return bikes.map(
      (bike) =>
        new BikeEntity({
          id: createBikeId(bike.id),
          manufacturerId: bike.manufacturerId,
          manufacturer: bike.manufacturer.name,
          modelName: bike.modelName,
          displacement: bike.displacement,
          modelYear: bike.modelYear,
        })
    )
  }
}
