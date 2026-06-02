import {
  createMyUserBikeId,
  createTouringId,
  MyUserBikeId,
  TouringId,
  TouringStatus,
} from '@repo/shared-types'
import { TouringEntity } from '../entities/TouringEntity'
import { ITouringRepository } from '../interfaces/ITouringRepository'
import { TouringSearchParams } from '../valueObjects/TouringSearchParams'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

const touringSelect = {
  id: true,
  userMyBikeId: true,
  title: true,
  startDate: true,
  endDate: true,
  startMileage: true,
  endMileage: true,
  startLatitude: true,
  startLongitude: true,
  endLatitude: true,
  endLongitude: true,
  status: true,
} as const

type TouringRow = {
  id: string
  userMyBikeId: string
  title: string
  startDate: Date
  endDate: Date
  startMileage: number | null
  endMileage: number | null
  startLatitude: number | null
  startLongitude: number | null
  endLatitude: number | null
  endLongitude: number | null
  status: TouringStatus
}

const toTouringEntity = (row: TouringRow): TouringEntity =>
  new TouringEntity({
    touringId: createTouringId(row.id),
    myUserBikeId: createMyUserBikeId(row.userMyBikeId),
    title: row.title,
    startDate: row.startDate,
    endDate: row.endDate,
    startMileage: row.startMileage,
    endMileage: row.endMileage,
    startLatitude: row.startLatitude,
    startLongitude: row.startLongitude,
    endLatitude: row.endLatitude,
    endLongitude: row.endLongitude,
    status: row.status,
  })

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
        startLatitude: touring.startLatitude,
        startLongitude: touring.startLongitude,
        endLatitude: touring.endLatitude,
        endLongitude: touring.endLongitude,
        status: touring.status,
      },
      select: touringSelect,
    })

    return toTouringEntity(created)
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
        startLatitude: touring.startLatitude,
        startLongitude: touring.startLongitude,
        endLatitude: touring.endLatitude,
        endLongitude: touring.endLongitude,
        status: touring.status,
      },
      select: touringSelect,
    })

    return toTouringEntity(updated)
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
        ...(searchParams.status !== undefined
          ? { status: searchParams.status }
          : {}),
      },
      select: touringSelect,
      orderBy,
    })

    return tourings.map(toTouringEntity)
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
      select: touringSelect,
    })

    if (!touring) {
      return null
    }

    return toTouringEntity(touring)
  }

  async findOngoingTouring(
    myUserBikeId: MyUserBikeId
  ): Promise<TouringEntity | null> {
    const touring = await this.connection.tUserMyBikeTouring.findFirst({
      where: {
        userMyBikeId: myUserBikeId,
        status: 'STARTED',
      },
      select: touringSelect,
    })

    if (!touring) {
      return null
    }

    return toTouringEntity(touring)
  }

  async updateTouringStatus(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId,
    status: TouringStatus
  ): Promise<TouringEntity> {
    const updated = await this.connection.tUserMyBikeTouring.update({
      where: {
        id: touringId,
        userMyBikeId: myUserBikeId,
      },
      data: {
        status,
      },
      select: touringSelect,
    })

    return toTouringEntity(updated)
  }

  async deleteTouring(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId
  ): Promise<void> {
    await this.connection.tUserMyBikeTouring.delete({
      where: {
        id: touringId,
        userMyBikeId: myUserBikeId,
      },
    })
  }

  async countTourings(myUserBikeId: MyUserBikeId): Promise<number> {
    return this.connection.tUserMyBikeTouring.count({
      where: { userMyBikeId: myUserBikeId },
    })
  }
}
