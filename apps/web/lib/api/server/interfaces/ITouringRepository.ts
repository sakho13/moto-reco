import { MyUserBikeId, TouringId } from '@repo/shared-types'
import { TouringEntity } from '../entities/TouringEntity'
import { TouringSearchParams } from '../valueObjects/TouringSearchParams'

export interface ITouringRepository {
  createTouring(touring: TouringEntity): Promise<TouringEntity>
  findTourings(
    myUserBikeId: MyUserBikeId,
    searchParams: TouringSearchParams
  ): Promise<TouringEntity[]>
  findTouringById(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId
  ): Promise<TouringEntity | null>
}
