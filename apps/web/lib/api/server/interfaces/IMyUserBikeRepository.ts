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
  fuelLogCount: number
  touringCount: number
}

export type PublicMyUserBikeDetail = {
  myUserBikeId: MyUserBikeId
  manufacturerName: string | null
  modelName: string | null
  nickname: string | null
  displacement: number
  modelYear: number | null
  totalMileage: number
  ownedAt: Date
  updatedAt: Date
}

export interface IMyUserBikeRepository {
  createMyUserBike(myUserBike: MyUserBikeEntity): Promise<MyUserBikeEntity>
  findMyUserBikes(
    userId: UserId,
    searchParams: UserBikeSearchParams
  ): Promise<MyUserBikeDetail[]>
  findPublicBikes(): Promise<PublicMyUserBikeDetail[]>
  findPublicBikesByUserId(
    userId: UserId,
    limit: number
  ): Promise<PublicMyUserBikeDetail[]>
  findMyUserBikeById(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<MyUserBikeEntity | null>
  updateMyUserBike(myUserBike: MyUserBikeEntity): Promise<MyUserBikeEntity>
  updateTotalMileage(
    userBikeId: UserBikeId,
    totalMileage: number
  ): Promise<void>
  findMyUserBikeDetail(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<MyUserBikeDetail | null>
  countOwnedBikes(userId: UserId): Promise<number>
  findMyUserBikeTotalMileage(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<number | null>
}
