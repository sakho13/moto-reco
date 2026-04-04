import { MyUserBikeId, TouringId } from '@repo/shared-types'
import { TouringEntity } from '../entities/TouringEntity'
import { TouringSearchParams } from '../valueObjects/TouringSearchParams'

export type PublicTouringDetail = {
  touringId: TouringId
  title: string
  startDate: Date
  endDate: Date
  startMileage: number | null
  endMileage: number | null
  status: 'STARTED' | 'COMPLETED'
}

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
  deleteTouring(touringId: TouringId, myUserBikeId: MyUserBikeId): Promise<void>
  findPublicTouringsByBikeId(
    myUserBikeId: MyUserBikeId
  ): Promise<PublicTouringDetail[]>
}
