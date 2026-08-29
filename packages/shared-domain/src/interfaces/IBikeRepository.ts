import { BikeEntity } from '../entities/BikeEntity'
import { BikeSearchParams } from '../valueObjects/BikeSearchParams'

export interface IBikeRepository {
  findById(bikeId: BikeEntity['id']): Promise<BikeEntity | null>
  search(params: BikeSearchParams): Promise<BikeEntity[]>
}
