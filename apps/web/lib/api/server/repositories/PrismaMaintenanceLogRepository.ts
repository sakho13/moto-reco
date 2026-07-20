import { Prisma } from '@repo/database'
import {
  createMaintenanceLogId,
  createMyUserBikeId,
  MaintenanceLogId,
  MaintenanceType,
  MyUserBikeId,
} from '@repo/shared-types'
import { MaintenanceLogEntity } from '../entities/MaintenanceLogEntity'
import { IMaintenanceLogRepository } from '../interfaces/IMaintenanceLogRepository'
import { MaintenanceLogSearchParams } from '../valueObjects/MaintenanceLogSearchParams'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

type MaintenanceLogRow = {
  id: string
  userMyBikeId: string
  performedAt: Date
  mileage: number
  memo: string | null
  maintenanceItems: Array<{
    type: MaintenanceType
    value: number | null
  }>
}

const mapToEntity = (row: MaintenanceLogRow): MaintenanceLogEntity => {
  return new MaintenanceLogEntity({
    maintenanceLogId: createMaintenanceLogId(row.id),
    myUserBikeId: createMyUserBikeId(row.userMyBikeId),
    performedAt: row.performedAt,
    mileage: row.mileage,
    memo: row.memo,
    items: row.maintenanceItems.map((item) => ({
      maintenanceType: item.type,
      value: item.value,
    })),
  })
}

export class PrismaMaintenanceLogRepository
  extends PrismaRepositoryBase
  implements IMaintenanceLogRepository
{
  async createMaintenanceLog(
    maintenanceLog: MaintenanceLogEntity
  ): Promise<MaintenanceLogEntity> {
    const created = await this.connection.tUserMyBikeMaintenance.create({
      data: {
        userMyBikeId: maintenanceLog.myUserBikeId,
        performedAt: maintenanceLog.performedAt,
        mileage: maintenanceLog.mileage,
        memo: maintenanceLog.memo,
        maintenanceItems: {
          create: maintenanceLog.items.map((item) => ({
            type: item.maintenanceType,
            value: item.value,
          })),
        },
      },
      select: {
        id: true,
        userMyBikeId: true,
        performedAt: true,
        mileage: true,
        memo: true,
        maintenanceItems: {
          select: {
            type: true,
            value: true,
          },
        },
      },
    })

    return mapToEntity(created)
  }

  async findMaintenanceLogById(
    maintenanceLogId: MaintenanceLogId,
    myUserBikeId: MyUserBikeId
  ): Promise<MaintenanceLogEntity | null> {
    const maintenanceLog =
      await this.connection.tUserMyBikeMaintenance.findFirst({
        where: {
          id: maintenanceLogId,
          userMyBikeId: myUserBikeId,
        },
        select: {
          id: true,
          userMyBikeId: true,
          performedAt: true,
          mileage: true,
          memo: true,
          maintenanceItems: {
            select: {
              type: true,
              value: true,
            },
          },
        },
      })

    if (!maintenanceLog) {
      return null
    }

    return mapToEntity(maintenanceLog)
  }

  async findMaintenanceLogs(
    myUserBikeId: MyUserBikeId,
    searchParams: MaintenanceLogSearchParams
  ): Promise<MaintenanceLogEntity[]> {
    const where: Prisma.TUserMyBikeMaintenanceWhereInput = {
      userMyBikeId: myUserBikeId,
    }

    if (searchParams.keyword) {
      where.memo = { contains: searchParams.keyword, mode: 'insensitive' }
    }

    const logs = await this.connection.tUserMyBikeMaintenance.findMany({
      where,
      orderBy: { performedAt: searchParams.sortOrder },
      skip: searchParams.skip,
      take: searchParams.take,
      select: {
        id: true,
        userMyBikeId: true,
        performedAt: true,
        mileage: true,
        memo: true,
        maintenanceItems: {
          select: {
            type: true,
            value: true,
          },
        },
      },
    })

    return logs.map(mapToEntity)
  }

  async countMaintenanceLogs(myUserBikeId: MyUserBikeId): Promise<number> {
    return this.connection.tUserMyBikeMaintenance.count({
      where: { userMyBikeId: myUserBikeId },
    })
  }

  async updateMaintenanceLog(
    maintenanceLog: MaintenanceLogEntity
  ): Promise<MaintenanceLogEntity> {
    const updated = await this.connection.tUserMyBikeMaintenance.update({
      where: {
        id: maintenanceLog.id,
      },
      data: {
        performedAt: maintenanceLog.performedAt,
        mileage: maintenanceLog.mileage,
        memo: maintenanceLog.memo,
        maintenanceItems: {
          deleteMany: {},
          create: maintenanceLog.items.map((item) => ({
            type: item.maintenanceType,
            value: item.value,
          })),
        },
      },
      select: {
        id: true,
        userMyBikeId: true,
        performedAt: true,
        mileage: true,
        memo: true,
        maintenanceItems: {
          select: {
            type: true,
            value: true,
          },
        },
      },
    })

    return mapToEntity(updated)
  }
}
