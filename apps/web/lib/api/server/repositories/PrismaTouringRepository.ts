import {
  createMyUserBikeId,
  createTouringId,
  MyUserBikeId,
  TouringId,
} from '@repo/shared-types'
import { TouringEntity } from '../entities/TouringEntity'
import { ITouringRepository } from '../interfaces/ITouringRepository'
import { TouringSearchParams } from '../valueObjects/TouringSearchParams'
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
        status: touring.status,
      },
      select: {
        id: true,
        userMyBikeId: true,
        title: true,
        startDate: true,
        endDate: true,
        startMileage: true,
        endMileage: true,
        status: true,
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
      status: created.status,
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
        status: touring.status,
      },
      select: {
        id: true,
        userMyBikeId: true,
        title: true,
        startDate: true,
        endDate: true,
        startMileage: true,
        endMileage: true,
        status: true,
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
      status: updated.status,
    })
  }

  async findTourings(
    myUserBikeId: MyUserBikeId,
    searchParams: TouringSearchParams
  ): Promise<TouringEntity[]> {
    const orderBy =
      searchParams.sortBy === 'startDate'
        ? [
            { startDate: searchParams.sortOrder },
            { endDate: searchParams.sortOrder },
          ]
        : [
            { endDate: searchParams.sortOrder },
            { startDate: searchParams.sortOrder },
          ]

    const tourings = await this.connection.tUserMyBikeTouring.findMany({
      where: {
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
        status: true,
      },
      orderBy,
    })

    return tourings.map(
      (touring) =>
        new TouringEntity({
          touringId: createTouringId(touring.id),
          myUserBikeId: createMyUserBikeId(touring.userMyBikeId),
          title: touring.title,
          startDate: touring.startDate,
          endDate: touring.endDate,
          startMileage: touring.startMileage,
          endMileage: touring.endMileage,
          status: touring.status,
        })
    )
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
        status: true,
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
      status: touring.status,
    })
  }

  async findOngoingTouring(
    myUserBikeId: MyUserBikeId
  ): Promise<TouringEntity | null> {
    const touring = await this.connection.tUserMyBikeTouring.findFirst({
      where: {
        userMyBikeId: myUserBikeId,
        status: 'STARTED',
      },
      select: {
        id: true,
        userMyBikeId: true,
        title: true,
        startDate: true,
        endDate: true,
        startMileage: true,
        endMileage: true,
        status: true,
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
      status: touring.status,
    })
  }

  async updateTouringStatus(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId,
    status: 'STARTED' | 'COMPLETED'
  ): Promise<TouringEntity> {
    const updated = await this.connection.tUserMyBikeTouring.update({
      where: {
        id: touringId,
        userMyBikeId: myUserBikeId,
      },
      data: {
        status,
      },
      select: {
        id: true,
        userMyBikeId: true,
        title: true,
        startDate: true,
        endDate: true,
        startMileage: true,
        endMileage: true,
        status: true,
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
      status: updated.status,
    })
  }
}
