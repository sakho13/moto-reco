import { GoodsModelId } from '@repo/shared-types'
import { GoodsModelEntity } from '../entities/GoodsModelEntity'
import { GoodsModelSearchParams } from '../valueObjects/GoodsModelSearchParams'

export interface IGoodsModelRepository {
  search(params: GoodsModelSearchParams): Promise<GoodsModelEntity[]>
  findById(goodsModelId: GoodsModelId): Promise<GoodsModelEntity | null>
}
