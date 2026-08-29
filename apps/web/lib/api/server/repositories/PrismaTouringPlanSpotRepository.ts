import { PrismaClient } from '@repo/database'
import {
  TouringPlanSpotEntity,
  ITouringPlanSpotRepository,
  SingletonTouringPlanSpotData,
} from '@repo/shared-domain'
import {
  createTouringPlanId,
  createTouringPlanSpotId,
  TouringPlanId,
  TouringPlanRouteType,
  TouringPlanSpotId,
  TouringPlanSpotType,
} from '@repo/shared-types'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

const touringPlanSpotSelect = {
  id: true,
  planId: true,
  type: true,
  name: true,
  memo: true,
  latitude: true,
  longitude: true,
  stayMinutes: true,
  travelMinutesFromPrev: true,
  routeTypeFromPrev: true,
  sortOrder: true,
} as const

type TouringPlanSpotRow = {
  id: string
  planId: string
  type: TouringPlanSpotType
  name: string | null
  memo: string | null
  latitude: number | null
  longitude: number | null
  stayMinutes: number | null
  travelMinutesFromPrev: number | null
  routeTypeFromPrev: TouringPlanRouteType | null
  sortOrder: number
}

const toTouringPlanSpotEntity = (
  row: TouringPlanSpotRow
): TouringPlanSpotEntity =>
  new TouringPlanSpotEntity({
    touringPlanSpotId: createTouringPlanSpotId(row.id),
    touringPlanId: createTouringPlanId(row.planId),
    type: row.type,
    name: row.name,
    memo: row.memo,
    latitude: row.latitude,
    longitude: row.longitude,
    stayMinutes: row.stayMinutes,
    travelMinutesFromPrev: row.travelMinutesFromPrev,
    routeTypeFromPrev: row.routeTypeFromPrev,
    sortOrder: row.sortOrder,
  })

/**
 * ツーリングプランスポット（出発地・経由地・休憩・目的地）のPrisma実装リポジトリ
 */
export class PrismaTouringPlanSpotRepository
  extends PrismaRepositoryBase
  implements ITouringPlanSpotRepository
{
  async createPlanSpot(
    spot: TouringPlanSpotEntity
  ): Promise<TouringPlanSpotEntity> {
    const created = await this.connection.tUserMyBikeTouringPlanSpot.create({
      data: {
        planId: spot.touringPlanId,
        type: spot.type,
        name: spot.name,
        memo: spot.memo,
        latitude: spot.latitude,
        longitude: spot.longitude,
        stayMinutes: spot.stayMinutes,
        travelMinutesFromPrev: spot.travelMinutesFromPrev,
        routeTypeFromPrev: spot.routeTypeFromPrev,
        sortOrder: spot.sortOrder,
      },
      select: touringPlanSpotSelect,
    })

    return toTouringPlanSpotEntity(created)
  }

  async findPlanSpotsByPlanId(
    planId: TouringPlanId
  ): Promise<TouringPlanSpotEntity[]> {
    const spots = await this.connection.tUserMyBikeTouringPlanSpot.findMany({
      where: { planId },
      select: touringPlanSpotSelect,
      orderBy: { sortOrder: 'asc' },
    })

    return spots.map(toTouringPlanSpotEntity)
  }

  async findPlanSpotById(
    spotId: TouringPlanSpotId,
    planId: TouringPlanId
  ): Promise<TouringPlanSpotEntity | null> {
    const spot = await this.connection.tUserMyBikeTouringPlanSpot.findFirst({
      where: { id: spotId, planId },
      select: touringPlanSpotSelect,
    })

    if (!spot) return null

    return toTouringPlanSpotEntity(spot)
  }

  async findPlanSpotByType(
    planId: TouringPlanId,
    type: 'START' | 'DESTINATION'
  ): Promise<TouringPlanSpotEntity | null> {
    const spot = await this.connection.tUserMyBikeTouringPlanSpot.findFirst({
      where: { planId, type },
      select: touringPlanSpotSelect,
    })

    if (!spot) return null

    return toTouringPlanSpotEntity(spot)
  }

  async updatePlanSpot(
    spot: TouringPlanSpotEntity
  ): Promise<TouringPlanSpotEntity> {
    const updated = await this.connection.tUserMyBikeTouringPlanSpot.update({
      where: { id: spot.id },
      data: {
        name: spot.name,
        memo: spot.memo,
        latitude: spot.latitude,
        longitude: spot.longitude,
        stayMinutes: spot.stayMinutes,
        travelMinutesFromPrev: spot.travelMinutesFromPrev,
        routeTypeFromPrev: spot.routeTypeFromPrev,
        sortOrder: spot.sortOrder,
      },
      select: touringPlanSpotSelect,
    })

    return toTouringPlanSpotEntity(updated)
  }

  async deletePlanSpot(
    spotId: TouringPlanSpotId,
    planId: TouringPlanId
  ): Promise<void> {
    await this.connection.tUserMyBikeTouringPlanSpot.deleteMany({
      where: { id: spotId, planId },
    })
  }

  async reorderPlanSpots(
    spotIds: TouringPlanSpotId[],
    planId: TouringPlanId
  ): Promise<void> {
    await (this.connection as PrismaClient).$transaction(
      spotIds.map((spotId, index) =>
        this.connection.tUserMyBikeTouringPlanSpot.update({
          where: { id: spotId, planId },
          data: { sortOrder: index },
        })
      )
    )
  }

  async shiftSortOrdersFrom(
    planId: TouringPlanId,
    fromSortOrder: number
  ): Promise<void> {
    await this.connection.tUserMyBikeTouringPlanSpot.updateMany({
      where: { planId, sortOrder: { gte: fromSortOrder } },
      data: { sortOrder: { increment: 1 } },
    })
  }

  async upsertSingletonSpot(
    planId: TouringPlanId,
    type: 'START' | 'DESTINATION',
    data: SingletonTouringPlanSpotData | null
  ): Promise<TouringPlanSpotEntity | null> {
    const existing = await this.connection.tUserMyBikeTouringPlanSpot.findFirst(
      {
        where: { planId, type },
        select: touringPlanSpotSelect,
      }
    )

    if (data === null) {
      if (existing) {
        await this.connection.tUserMyBikeTouringPlanSpot.delete({
          where: { id: existing.id },
        })
      }
      return null
    }

    if (existing) {
      const updated = await this.connection.tUserMyBikeTouringPlanSpot.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          memo: data.memo,
          latitude: data.latitude,
          longitude: data.longitude,
          travelMinutesFromPrev: data.travelMinutesFromPrev,
          routeTypeFromPrev: data.routeTypeFromPrev,
        },
        select: touringPlanSpotSelect,
      })

      return toTouringPlanSpotEntity(updated)
    }

    const sortOrder = type === 'START' ? 0 : 9999
    const created = await this.connection.tUserMyBikeTouringPlanSpot.create({
      data: {
        planId,
        type,
        name: data.name,
        memo: data.memo,
        latitude: data.latitude,
        longitude: data.longitude,
        travelMinutesFromPrev: data.travelMinutesFromPrev,
        routeTypeFromPrev: data.routeTypeFromPrev,
        sortOrder,
      },
      select: touringPlanSpotSelect,
    })

    return toTouringPlanSpotEntity(created)
  }
}
