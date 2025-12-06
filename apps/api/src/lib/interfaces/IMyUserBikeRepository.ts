import { MyUserBikeEntity } from '../classes/entities/MyUserBikeEntity'

export interface IMyUserBikeRepository {
  createMyUserBike(myUserBike: MyUserBikeEntity): Promise<MyUserBikeEntity>
}
