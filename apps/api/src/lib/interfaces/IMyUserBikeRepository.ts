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
  ): Promise<MyUserBikeDetail | null>
  updateTotalMileage(myUserBikeId: MyUserBikeId, totalMileage: number): Promise<void>
}
