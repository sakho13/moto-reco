import { UserGoodsId, UserId } from '@repo/shared-types'
import { UserGoodsEntity } from '../entities/UserGoodsEntity'
import { UserGoodsSearchParams } from '../valueObjects/UserGoodsSearchParams'

export interface IUserGoodsRepository {
  createUserGoods(userGoods: UserGoodsEntity): Promise<UserGoodsEntity>
  findUserGoodsList(
    userId: UserId,
    searchParams: UserGoodsSearchParams
  ): Promise<UserGoodsEntity[]>
  findUserGoodsById(
    userGoodsId: UserGoodsId,
    userId: UserId
  ): Promise<UserGoodsEntity | null>
  updateUserGoods(userGoods: UserGoodsEntity): Promise<UserGoodsEntity>
  deleteUserGoods(userGoodsId: UserGoodsId, userId: UserId): Promise<void>
  countUserGoods(userId: UserId): Promise<number>
}
