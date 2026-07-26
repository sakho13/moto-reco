import { Prisma } from '@repo/database'
import {
  createCompanyId,
  createGoodsModelId,
  createMyUserBikeId,
  createUserGoodsId,
  createUserId,
  UserGoodsId,
  UserId,
} from '@repo/shared-types'
import { UserGoodsEntity } from '../entities/UserGoodsEntity'
import { IUserGoodsRepository } from '../interfaces/IUserGoodsRepository'
import { UserGoodsSearchParams } from '../valueObjects/UserGoodsSearchParams'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

const userGoodsInclude = {
  goodsModel: {
    include: {
      manufacturer: true,
    },
  },
} satisfies Prisma.TUserGoodsInclude

type UserGoodsWithRelations = Prisma.TUserGoodsGetPayload<{
  include: typeof userGoodsInclude
}>

export class PrismaUserGoodsRepository
  extends PrismaRepositoryBase
  implements IUserGoodsRepository
{
  private toEntity(record: UserGoodsWithRelations): UserGoodsEntity {
    return new UserGoodsEntity({
      userGoodsId: createUserGoodsId(record.id),
      userId: createUserId(record.userId),
      userMyBikeId: record.userMyBikeId
        ? createMyUserBikeId(record.userMyBikeId)
        : null,
      goodsModelId: createGoodsModelId(record.goodsModelId),
      purchasedAt: record.purchasedAt,
      price: record.price,
      memo: record.memo,
      goodsManufacturerId: createCompanyId(
        record.goodsModel.goodsManufacturerId
      ),
      manufacturerName: record.goodsModel.manufacturer.name,
      modelNumber: record.goodsModel.modelNumber,
      modelName: record.goodsModel.name,
      category: record.goodsModel.category,
      amazonAsin: record.goodsModel.amazonAsin,
      rakutenItemId: record.goodsModel.rakutenItemId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }

  async createUserGoods(userGoods: UserGoodsEntity): Promise<UserGoodsEntity> {
    const created = await this.connection.tUserGoods.create({
      data: {
        userId: userGoods.userId,
        userMyBikeId: userGoods.userMyBikeId,
        goodsModelId: userGoods.goodsModelId,
        purchasedAt: userGoods.purchasedAt,
        price: userGoods.price,
        memo: userGoods.memo,
      },
      include: userGoodsInclude,
    })

    return this.toEntity(created)
  }

  async findUserGoodsList(
    userId: UserId,
    searchParams: UserGoodsSearchParams
  ): Promise<UserGoodsEntity[]> {
    const list = await this.connection.tUserGoods.findMany({
      where: {
        userId,
        ...(searchParams.myUserBikeId
          ? { userMyBikeId: searchParams.myUserBikeId }
          : {}),
      },
      include: userGoodsInclude,
      orderBy: [{ purchasedAt: 'desc' }, { createdAt: 'desc' }],
      skip: searchParams.skip,
      take: searchParams.take,
    })

    return list.map((record) => this.toEntity(record))
  }

  async findUserGoodsById(
    userGoodsId: UserGoodsId,
    userId: UserId
  ): Promise<UserGoodsEntity | null> {
    const record = await this.connection.tUserGoods.findFirst({
      where: { id: userGoodsId, userId },
      include: userGoodsInclude,
    })

    if (!record) {
      return null
    }

    return this.toEntity(record)
  }

  async updateUserGoods(userGoods: UserGoodsEntity): Promise<UserGoodsEntity> {
    const updated = await this.connection.tUserGoods.update({
      where: { id: userGoods.id },
      data: {
        userMyBikeId: userGoods.userMyBikeId,
        goodsModelId: userGoods.goodsModelId,
        purchasedAt: userGoods.purchasedAt,
        price: userGoods.price,
        memo: userGoods.memo,
      },
      include: userGoodsInclude,
    })

    return this.toEntity(updated)
  }

  async deleteUserGoods(
    userGoodsId: UserGoodsId,
    userId: UserId
  ): Promise<void> {
    await this.connection.tUserGoods.delete({
      where: { id: userGoodsId, userId },
    })
  }

  async countUserGoods(userId: UserId): Promise<number> {
    return this.connection.tUserGoods.count({
      where: { userId },
    })
  }
}
