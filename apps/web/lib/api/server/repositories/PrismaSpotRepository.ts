import { PrismaClient } from '@repo/database'
import {
  createSpotId,
  createTouringId,
  SpotId,
  SpotType,
  TouringId,
} from '@repo/shared-types'
import { SpotEntity } from '../entities/SpotEntity'
import { ISpotRepository } from '../interfaces/ISpotRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

const spotSelect = {
  id: true,
  touringId: true,
  type: true,
  name: true,
  memo: true,
  latitude: true,
  longitude: true,
  visitedAt: true,
  endAt: true,
  sortOrder: true,
  plannedAt: true,
  plannedDepartAt: true,
  isSkipped: true,
} as const

type SpotRow = {
  id: string
  touringId: string
  type: SpotType
  name: string | null
  memo: string | null
  latitude: number | null
  longitude: number | null
  visitedAt: Date | null
  endAt: Date | null
  sortOrder: number
  plannedAt: Date | null
  plannedDepartAt: Date | null
  isSkipped: boolean
}

const toSpotEntity = (row: SpotRow): SpotEntity =>
  new SpotEntity({
    spotId: createSpotId(row.id),
    touringId: createTouringId(row.touringId),
    type: row.type,
    name: row.name,
    memo: row.memo,
    latitude: row.latitude,
    longitude: row.longitude,
    visitedAt: row.visitedAt,
    endAt: row.endAt,
    sortOrder: row.sortOrder,
    plannedAt: row.plannedAt,
    plannedDepartAt: row.plannedDepartAt,
    isSkipped: row.isSkipped,
  })

export class PrismaSpotRepository
  extends PrismaRepositoryBase
  implements ISpotRepository
{
  async createSpot(spot: SpotEntity): Promise<SpotEntity> {
    const created = await this.connection.tUserMyBikeTouringSpot.create({
      data: {
        touringId: spot.touringId,
        type: spot.type,
        name: spot.name,
        memo: spot.memo,
        latitude: spot.latitude,
        longitude: spot.longitude,
        visitedAt: spot.visitedAt,
        endAt: spot.endAt,
        sortOrder: spot.sortOrder,
        plannedAt: spot.plannedAt,
        plannedDepartAt: spot.plannedDepartAt,
      },
      select: spotSelect,
    })

    return toSpotEntity(created)
  }

  async findSpotsByTouringId(touringId: TouringId): Promise<SpotEntity[]> {
    const spots = await this.connection.tUserMyBikeTouringSpot.findMany({
      where: { touringId },
      select: spotSelect,
      orderBy: { sortOrder: 'asc' },
    })

    return spots.map(toSpotEntity)
  }

  async findSpotById(
    spotId: SpotId,
    touringId: TouringId
  ): Promise<SpotEntity | null> {
    const spot = await this.connection.tUserMyBikeTouringSpot.findFirst({
      where: { id: spotId, touringId },
      select: spotSelect,
    })

    if (!spot) return null

    return toSpotEntity(spot)
  }

  async updateSpot(spot: SpotEntity): Promise<SpotEntity> {
    const updated = await this.connection.tUserMyBikeTouringSpot.update({
      where: { id: spot.id },
      data: {
        name: spot.name,
        memo: spot.memo,
        latitude: spot.latitude,
        longitude: spot.longitude,
        visitedAt: spot.visitedAt,
        endAt: spot.endAt,
        plannedAt: spot.plannedAt,
        plannedDepartAt: spot.plannedDepartAt,
        isSkipped: spot.isSkipped,
      },
      select: spotSelect,
    })

    return toSpotEntity(updated)
  }

  async deleteSpot(spotId: SpotId, touringId: TouringId): Promise<void> {
    await this.connection.tUserMyBikeTouringSpot.deleteMany({
      where: { id: spotId, touringId },
    })
  }

  async reorderSpots(spotIds: SpotId[]): Promise<void> {
    await (this.connection as PrismaClient).$transaction(
      spotIds.map((spotId, index) =>
        this.connection.tUserMyBikeTouringSpot.update({
          where: { id: spotId },
          data: { sortOrder: index },
        })
      )
    )
  }

  async shiftSortOrdersFrom(
    touringId: TouringId,
    fromSortOrder: number
  ): Promise<void> {
    await this.connection.tUserMyBikeTouringSpot.updateMany({
      where: { touringId, sortOrder: { gte: fromSortOrder } },
      data: { sortOrder: { increment: 1 } },
    })
  }
}
