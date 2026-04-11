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
        totalMileage: userBike.totalMileage,
      },
      select: {
        id: true,
        bikeId: true,
        displacement: true,
        totalMileage: true,
        serialNumber: true,
      },
    })

    return new UserBikeEntity({
      bikeId: created.bikeId ? createBikeId(created.bikeId) : null,
      userBikeId: createUserBikeId(created.id),
      displacement: created.displacement,
      totalMileage: created.totalMileage,
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
        totalMileage: true,
        serialNumber: true,
      },
    })

    return new UserBikeEntity({
      bikeId: updated.bikeId ? createBikeId(updated.bikeId) : null,
      userBikeId: createUserBikeId(updated.id),
      displacement: updated.displacement,
      totalMileage: updated.totalMileage,
      serialNumber: updated.serialNumber,
    })
  }

  async updateTotalMileage(
    userBikeId: UserBikeEntity['id'],
    totalMileage: number
  ): Promise<UserBikeEntity> {
    const updated = await this.connection.tUserBike.update({
      where: { id: userBikeId },
      data: {
        totalMileage,
      },
      select: {
        id: true,
        bikeId: true,
        displacement: true,
        totalMileage: true,
        serialNumber: true,
      },
    })

    return new UserBikeEntity({
      bikeId: updated.bikeId ? createBikeId(updated.bikeId) : null,
      userBikeId: createUserBikeId(updated.id),
      displacement: updated.displacement,
      totalMileage: updated.totalMileage,
      serialNumber: updated.serialNumber,
    })
  }

  async updateTotalMileageIfGreater(
    userBikeId: UserBikeEntity['id'],
    totalMileage: number
  ): Promise<boolean> {
    const result = await this.connection.tUserBike.updateMany({
      where: {
        id: userBikeId,
        totalMileage: {
          lt: totalMileage,
        },
      },
      data: {
        totalMileage,
      },
    })

    return result.count > 0
  }
}
