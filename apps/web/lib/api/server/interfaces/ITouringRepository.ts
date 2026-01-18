import { MyUserBikeId, TouringId } from '@repo/shared-types'
import { TouringEntity } from '../entities/TouringEntity'

export interface ITouringRepository {
  createTouring(touring: TouringEntity): Promise<TouringEntity>
  updateTouring(touring: TouringEntity): Promise<TouringEntity>
  findTouringById(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId
  ): Promise<TouringEntity | null>
}
