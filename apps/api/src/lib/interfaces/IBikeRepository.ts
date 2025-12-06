import { BikeEntity } from '../classes/entities/BikeEntity'
import { BikeSearchParams } from '../classes/valueObjects/BikeSearchParams'

export interface IBikeRepository {
  findById(bikeId: BikeEntity['id']): Promise<BikeEntity | null>
  search(params: BikeSearchParams): Promise<BikeEntity[]>
}
