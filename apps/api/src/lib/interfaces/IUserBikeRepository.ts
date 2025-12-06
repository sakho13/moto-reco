import { UserBikeEntity } from '../classes/entities/UserBikeEntity'

export interface IUserBikeRepository {
  createUserBike(userBike: UserBikeEntity): Promise<UserBikeEntity>
}
