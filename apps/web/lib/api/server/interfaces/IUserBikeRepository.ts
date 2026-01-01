import { UserBikeEntity } from '../entities/UserBikeEntity'

export interface IUserBikeRepository {
  createUserBike(userBike: UserBikeEntity): Promise<UserBikeEntity>
  updateUserBikeDisplacement(
    userBikeId: UserBikeEntity['id'],
    displacement: number
  ): Promise<UserBikeEntity>
}
