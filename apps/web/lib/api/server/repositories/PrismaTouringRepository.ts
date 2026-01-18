import {
  createMyUserBikeId,
  createTouringId,
  MyUserBikeId,
  TouringId,
} from '@repo/shared-types'
import { TouringEntity } from '../entities/TouringEntity'
import { ITouringRepository } from '../interfaces/ITouringRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaTouringRepository
  extends PrismaRepositoryBase
  implements ITouringRepository
{
  async createTouring(touring: TouringEntity): Promise<TouringEntity> {
    const created = await this.connection.tUserMyBikeTouring.create({
      data: {
        userMyBikeId: touring.myUserBikeId,
        title: touring.title,
        startDate: touring.startDate,
        endDate: touring.endDate,
        startMileage: touring.startMileage,
        endMileage: touring.endMileage,
      },
      select: {
        id: true,
        userMyBikeId: true,
        title: true,
        startDate: true,
        endDate: true,
        startMileage: true,
        endMileage: true,
      },
    })

    return new TouringEntity({
      touringId: createTouringId(created.id),
      myUserBikeId: createMyUserBikeId(created.userMyBikeId),
      title: created.title,
      startDate: created.startDate,
      endDate: created.endDate,
      startMileage: created.startMileage,
      endMileage: created.endMileage,
    })
  }

  async updateTouring(touring: TouringEntity): Promise<TouringEntity> {
    const updated = await this.connection.tUserMyBikeTouring.update({
      where: {
        id: touring.id,
      },
      data: {
        title: touring.title,
        startDate: touring.startDate,
        endDate: touring.endDate,
        startMileage: touring.startMileage,
        endMileage: touring.endMileage,
      },
      select: {
        id: true,
        userMyBikeId: true,
        title: true,
        startDate: true,
        endDate: true,
        startMileage: true,
        endMileage: true,
      },
    })

    return new TouringEntity({
      touringId: createTouringId(updated.id),
      myUserBikeId: createMyUserBikeId(updated.userMyBikeId),
      title: updated.title,
      startDate: updated.startDate,
      endDate: updated.endDate,
      startMileage: updated.startMileage,
      endMileage: updated.endMileage,
    })
  }

  async findTouringById(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId
  ): Promise<TouringEntity | null> {
    const touring = await this.connection.tUserMyBikeTouring.findFirst({
      where: {
        id: touringId,
        userMyBikeId: myUserBikeId,
      },
      select: {
        id: true,
        userMyBikeId: true,
        title: true,
        startDate: true,
        endDate: true,
        startMileage: true,
        endMileage: true,
      },
    })

    if (!touring) {
      return null
    }

    return new TouringEntity({
      touringId: createTouringId(touring.id),
      myUserBikeId: createMyUserBikeId(touring.userMyBikeId),
      title: touring.title,
      startDate: touring.startDate,
      endDate: touring.endDate,
      startMileage: touring.startMileage,
      endMileage: touring.endMileage,
    })
  }
}
