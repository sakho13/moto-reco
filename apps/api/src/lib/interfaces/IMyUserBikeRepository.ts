import {
  BikeId,
  MyUserBikeId,
  UserBikeId,
  UserId,
} from '@shared-types/index'
import { MyUserBikeEntity } from '../classes/entities/MyUserBikeEntity'

export type MyUserBikeDetail = {
  userBikeId: UserBikeId
  myUserBikeId: MyUserBikeId
  bikeId: BikeId
  manufacturerName: string
  modelName: string
  nickname: string | null
  purchaseDate: Date | null
  purchasePrice: number | null
  purchaseMileage: number | null
  totalMileage: number
  displacement: number
  modelYear: number
  createdAt: Date
  updatedAt: Date
}

export interface IMyUserBikeRepository {
  createMyUserBike(myUserBike: MyUserBikeEntity): Promise<MyUserBikeEntity>
  findMyUserBikes(userId: UserId): Promise<MyUserBikeDetail[]>
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
