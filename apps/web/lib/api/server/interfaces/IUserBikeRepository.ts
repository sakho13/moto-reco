import { UserBikeEntity } from '../entities/UserBikeEntity'

export interface IUserBikeRepository {
  createUserBike(userBike: UserBikeEntity): Promise<UserBikeEntity>
}
