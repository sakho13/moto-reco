import { createManufacturerId } from '@repo/shared-types'
import { ManufacturerEntity } from '../entities/ManufacturerEntity'
import { IManufactureRepository } from '../interfaces/IManufacturerRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaManufacturerRepository
  extends PrismaRepositoryBase
  implements IManufactureRepository
{
  async findAll(): Promise<ManufacturerEntity[]> {
    const manufacturers = await this.connection.mManufacturer.findMany()
    return manufacturers.map(
      (manufacturer) =>
        new ManufacturerEntity({
          id: createManufacturerId(manufacturer.id),
          name: manufacturer.name,
          nameEn: manufacturer.nameEn ?? '',
          country: manufacturer.country ?? '',
        })
    )
  }
}
