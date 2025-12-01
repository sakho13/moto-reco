import { ManufacturerEntity } from '../classes/entities/ManufacturerEntity'

export interface IManufactureRepository {
  findAll(): Promise<ManufacturerEntity[]>
}
