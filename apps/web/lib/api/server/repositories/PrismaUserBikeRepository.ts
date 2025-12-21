import { createBikeId, createUserBikeId } from '@packages/shared-types'
import { UserBikeEntity } from '../entities/UserBikeEntity'
import { IUserBikeRepository } from '../interfaces/IUserBikeRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaUserBikeRepository
  extends PrismaRepositoryBase
  implements IUserBikeRepository
{
  async createUserBike(userBike: UserBikeEntity): Promise<UserBikeEntity> {
    const created = await this.connection.tUserBike.create({
      data: {
        bikeId: userBike.bikeId,
        displacement: userBike.displacement,
        serialNumber: userBike.serialNumber,
      },
      select: {
        id: true,
        bikeId: true,
        displacement: true,
        serialNumber: true,
      },
    })

    return new UserBikeEntity({
      bikeId: created.bikeId ? createBikeId(created.bikeId) : null,
      userBikeId: createUserBikeId(created.id),
      displacement: created.displacement,
      serialNumber: created.serialNumber,
    })
  }
}
