import {
  createMaintenanceLogId,
  createMyUserBikeId,
  MaintenanceLogId,
  MaintenanceType,
  MyUserBikeId,
} from '@repo/shared-types'
import { MaintenanceLogEntity } from '../entities/MaintenanceLogEntity'
import { IMaintenanceLogRepository } from '../interfaces/IMaintenanceLogRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

const toMaintenanceLogEntity = (log: {
  id: string
  userMyBikeId: string
  performedAt: Date
  mileage: number
  memo: string | null
  items: Array<{
    maintenanceType: MaintenanceType
    value: string
  }>
}): MaintenanceLogEntity =>
  new MaintenanceLogEntity({
    maintenanceLogId: createMaintenanceLogId(log.id),
    myUserBikeId: createMyUserBikeId(log.userMyBikeId),
    performedAt: log.performedAt,
    mileage: log.mileage,
    memo: log.memo,
    items: log.items.map((item) => ({
      type: item.maintenanceType,
      value: item.value,
    })),
  })

export class PrismaMaintenanceLogRepository
  extends PrismaRepositoryBase
  implements IMaintenanceLogRepository
{
  async createMaintenanceLog(
    maintenanceLog: MaintenanceLogEntity
  ): Promise<MaintenanceLogEntity> {
    const created = await this.connection.tUserMyBikeMaintenanceLog.create({
      data: {
        userMyBikeId: maintenanceLog.myUserBikeId,
        performedAt: maintenanceLog.performedAt,
        mileage: maintenanceLog.mileage,
        memo: maintenanceLog.memo,
        items: {
          create: maintenanceLog.items.map((item) => ({
            maintenanceType: item.type,
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
        items: {
          select: {
            maintenanceType: true,
            value: true,
          },
          orderBy: {
            maintenanceType: 'asc',
          },
        },
      },
    })

    return toMaintenanceLogEntity(created)
  }

  async findMaintenanceLogById(
    maintenanceLogId: MaintenanceLogId,
    myUserBikeId: MyUserBikeId
  ): Promise<MaintenanceLogEntity | null> {
    const maintenanceLog =
      await this.connection.tUserMyBikeMaintenanceLog.findFirst({
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
          items: {
            select: {
              maintenanceType: true,
              value: true,
            },
            orderBy: {
              maintenanceType: 'asc',
            },
          },
        },
      })

    if (!maintenanceLog) {
      return null
    }

    return toMaintenanceLogEntity(maintenanceLog)
  }

  async updateMaintenanceLog(
    maintenanceLog: MaintenanceLogEntity
  ): Promise<MaintenanceLogEntity> {
    const updated = await this.connection.tUserMyBikeMaintenanceLog.update({
      where: {
        id: maintenanceLog.id,
      },
      data: {
        performedAt: maintenanceLog.performedAt,
        mileage: maintenanceLog.mileage,
        memo: maintenanceLog.memo,
        items: {
          deleteMany: {},
          create: maintenanceLog.items.map((item) => ({
            maintenanceType: item.type,
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
        items: {
          select: {
            maintenanceType: true,
            value: true,
          },
          orderBy: {
            maintenanceType: 'asc',
          },
        },
      },
    })

    return toMaintenanceLogEntity(updated)
  }
}
