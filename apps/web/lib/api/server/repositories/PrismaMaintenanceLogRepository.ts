import {
  createMaintenanceLogId,
  createMyUserBikeId,
  MaintenanceLogId,
  MaintenanceType,
  MyUserBikeId,
} from '@repo/shared-types'
import { MaintenanceLogEntity } from '../entities/MaintenanceLogEntity'
import {
  IMaintenanceLogRepository,
  MaintenanceLogListParams,
} from '../interfaces/IMaintenanceLogRepository'
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
    params: MaintenanceLogListParams
  ): Promise<MaintenanceLogEntity[]> {
    const { myUserBikeId, page, perSize, sortOrder } = params
    const logs = await this.connection.tUserMyBikeMaintenance.findMany({
      where: { userMyBikeId: myUserBikeId },
      orderBy: { performedAt: sortOrder },
      skip: (page - 1) * perSize,
      take: perSize,
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
