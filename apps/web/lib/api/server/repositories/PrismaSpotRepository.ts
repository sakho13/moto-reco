import { PrismaClient } from '@repo/database'
import {
  createSpotId,
  createTouringId,
  SpotId,
  TouringId,
} from '@repo/shared-types'
import { SpotEntity } from '../entities/SpotEntity'
import { ISpotRepository } from '../interfaces/ISpotRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaSpotRepository
  extends PrismaRepositoryBase
  implements ISpotRepository
{
  async createSpot(spot: SpotEntity): Promise<SpotEntity> {
    const count = await this.connection.tUserMyBikeTouringSpot.count({
      where: { touringId: spot.touringId },
    })

    const created = await this.connection.tUserMyBikeTouringSpot.create({
      data: {
        touringId: spot.touringId,
        name: spot.name,
        memo: spot.memo,
        latitude: spot.latitude,
        longitude: spot.longitude,
        visitedAt: spot.visitedAt,
        sortOrder: count,
      },
      select: {
        id: true,
        touringId: true,
        name: true,
        memo: true,
        latitude: true,
        longitude: true,
        visitedAt: true,
        sortOrder: true,
      },
    })

    return new SpotEntity({
      spotId: createSpotId(created.id),
      touringId: createTouringId(created.touringId),
      name: created.name,
      memo: created.memo,
      latitude: created.latitude,
      longitude: created.longitude,
      visitedAt: created.visitedAt,
      sortOrder: created.sortOrder,
    })
  }

  async findSpotsByTouringId(touringId: TouringId): Promise<SpotEntity[]> {
    const spots = await this.connection.tUserMyBikeTouringSpot.findMany({
      where: {
        touringId,
      },
      select: {
        id: true,
        touringId: true,
        name: true,
        memo: true,
        latitude: true,
        longitude: true,
        visitedAt: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    return spots.map(
      (spot) =>
        new SpotEntity({
          spotId: createSpotId(spot.id),
          touringId: createTouringId(spot.touringId),
          name: spot.name,
          memo: spot.memo,
          latitude: spot.latitude,
          longitude: spot.longitude,
          visitedAt: spot.visitedAt,
          sortOrder: spot.sortOrder,
        })
    )
  }

  async findSpotById(
    spotId: SpotId,
    touringId: TouringId
  ): Promise<SpotEntity | null> {
    const spot = await this.connection.tUserMyBikeTouringSpot.findFirst({
      where: {
        id: spotId,
        touringId,
      },
      select: {
        id: true,
        touringId: true,
        name: true,
        memo: true,
        latitude: true,
        longitude: true,
        visitedAt: true,
        sortOrder: true,
      },
    })

    if (!spot) {
      return null
    }

    return new SpotEntity({
      spotId: createSpotId(spot.id),
      touringId: createTouringId(spot.touringId),
      name: spot.name,
      memo: spot.memo,
      latitude: spot.latitude,
      longitude: spot.longitude,
      visitedAt: spot.visitedAt,
      sortOrder: spot.sortOrder,
    })
  }

  async updateSpot(spot: SpotEntity): Promise<SpotEntity> {
    const updated = await this.connection.tUserMyBikeTouringSpot.update({
      where: {
        id: spot.id,
      },
      data: {
        name: spot.name,
        memo: spot.memo,
        latitude: spot.latitude,
        longitude: spot.longitude,
        visitedAt: spot.visitedAt,
      },
      select: {
        id: true,
        touringId: true,
        name: true,
        memo: true,
        latitude: true,
        longitude: true,
        visitedAt: true,
        sortOrder: true,
      },
    })

    return new SpotEntity({
      spotId: createSpotId(updated.id),
      touringId: createTouringId(updated.touringId),
      name: updated.name,
      memo: updated.memo,
      latitude: updated.latitude,
      longitude: updated.longitude,
      visitedAt: updated.visitedAt,
      sortOrder: updated.sortOrder,
    })
  }

  async deleteSpot(spotId: SpotId, touringId: TouringId): Promise<void> {
    await this.connection.tUserMyBikeTouringSpot.deleteMany({
      where: {
        id: spotId,
        touringId,
      },
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
}
