import { MyUserBikeId, TouringId } from '@repo/shared-types'
import { TouringEntity } from '../entities/TouringEntity'
import { TouringSearchParams } from '../valueObjects/TouringSearchParams'

export interface ITouringRepository {
  createTouring(touring: TouringEntity): Promise<TouringEntity>
  updateTouring(touring: TouringEntity): Promise<TouringEntity>
  findTourings(
    myUserBikeId: MyUserBikeId,
    searchParams: TouringSearchParams
  ): Promise<TouringEntity[]>
  findTouringById(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId
  ): Promise<TouringEntity | null>
  findOngoingTouring(myUserBikeId: MyUserBikeId): Promise<TouringEntity | null>
  updateTouringStatus(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId,
    status: 'STARTED' | 'COMPLETED'
  ): Promise<TouringEntity>
}
