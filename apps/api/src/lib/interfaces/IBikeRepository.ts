import { BikeEntity } from '../classes/entities/BikeEntity'
import { BikeSearchParams } from '../classes/valueObjects/BikeSearchParams'

export interface IBikeRepository {
  search(params: BikeSearchParams): Promise<BikeEntity[]>
}
