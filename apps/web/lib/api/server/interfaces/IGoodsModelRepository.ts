import { GoodsModelEntity } from '../entities/GoodsModelEntity'
import { GoodsModelSearchParams } from '../valueObjects/GoodsModelSearchParams'

export interface IGoodsModelRepository {
  search(params: GoodsModelSearchParams): Promise<GoodsModelEntity[]>
}
