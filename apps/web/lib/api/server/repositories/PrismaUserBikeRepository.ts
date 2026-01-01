import { createBikeId, createUserBikeId } from '@repo/shared-types'
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

  async updateUserBikeDisplacement(
    userBikeId: UserBikeEntity['id'],
    displacement: number
  ): Promise<UserBikeEntity> {
    const updated = await this.connection.tUserBike.update({
      where: { id: userBikeId },
      data: {
        displacement,
      },
      select: {
        id: true,
        bikeId: true,
        displacement: true,
        serialNumber: true,
      },
    })

    return new UserBikeEntity({
      bikeId: updated.bikeId ? createBikeId(updated.bikeId) : null,
      userBikeId: createUserBikeId(updated.id),
      displacement: updated.displacement,
      serialNumber: updated.serialNumber,
    })
  }
}
