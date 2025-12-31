import { BikeId, MyUserBikeId, UserBikeId, UserId } from '@repo/shared-types'
import { MyUserBikeEntity } from '../entities/MyUserBikeEntity'
import { UserBikeSearchParams } from '../valueObjects/UserBikeSearchParams'

export type MyUserBikeDetail = {
  userBikeId: UserBikeId
  myUserBikeId: MyUserBikeId
  bikeId: BikeId | null
  manufacturerName: string | null
  modelName: string | null
  nickname: string | null
  purchaseDate: Date | null
  purchasePrice: number | null
  purchaseMileage: number | null
  totalMileage: number
  displacement: number
  modelYear: number | null
  createdAt: Date
  updatedAt: Date
}

export interface IMyUserBikeRepository {
  createMyUserBike(myUserBike: MyUserBikeEntity): Promise<MyUserBikeEntity>
  findMyUserBikes(
    userId: UserId,
    searchParams: UserBikeSearchParams
  ): Promise<MyUserBikeDetail[]>
  findMyUserBikeById(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<MyUserBikeEntity | null>
  updateMyUserBike(myUserBike: MyUserBikeEntity): Promise<MyUserBikeEntity>
  findMyUserBikeDetail(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<MyUserBikeDetail | null>
}
