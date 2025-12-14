import { ManufacturerEntity } from '../entities/ManufacturerEntity'

export interface IManufactureRepository {
  findAll(): Promise<ManufacturerEntity[]>
}
