import { createGoodsManufacturerId } from '@repo/shared-types'
import { GoodsManufacturerEntity } from '../entities/GoodsManufacturerEntity'
import { IGoodsManufacturerRepository } from '../interfaces/IGoodsManufacturerRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaGoodsManufacturerRepository
  extends PrismaRepositoryBase
  implements IGoodsManufacturerRepository
{
  async findAll(): Promise<GoodsManufacturerEntity[]> {
    const manufacturers = await this.connection.mGoodsManufacturer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    return manufacturers.map(
      (manufacturer) =>
        new GoodsManufacturerEntity({
          id: createGoodsManufacturerId(manufacturer.id),
          name: manufacturer.name,
          nameEn: manufacturer.nameEn,
        })
    )
  }
}
