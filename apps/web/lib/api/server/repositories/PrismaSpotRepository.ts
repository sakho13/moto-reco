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
    const created = await this.connection.tUserMyBikeTouringSpot.create({
      data: {
        touringId: spot.touringId,
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
      },
      orderBy: {
        visitedAt: 'asc',
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
}
