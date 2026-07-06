import { GoodsManufacturerEntity } from '../entities/GoodsManufacturerEntity'

export interface IGoodsManufacturerRepository {
  findAll(): Promise<GoodsManufacturerEntity[]>
}
