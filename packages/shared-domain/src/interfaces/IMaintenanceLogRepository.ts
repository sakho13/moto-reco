import { MaintenanceLogId, MyUserBikeId } from '@repo/shared-types'
import { MaintenanceLogEntity } from '../entities/MaintenanceLogEntity'
import { MaintenanceLogSearchParams } from '../valueObjects/MaintenanceLogSearchParams'

export interface IMaintenanceLogRepository {
  createMaintenanceLog(
    maintenanceLog: MaintenanceLogEntity
  ): Promise<MaintenanceLogEntity>
  findMaintenanceLogById(
    maintenanceLogId: MaintenanceLogId,
    myUserBikeId: MyUserBikeId
  ): Promise<MaintenanceLogEntity | null>
  findMaintenanceLogs(
    myUserBikeId: MyUserBikeId,
    searchParams: MaintenanceLogSearchParams
  ): Promise<MaintenanceLogEntity[]>
  findAllMaintenanceLogs(
    myUserBikeId: MyUserBikeId,
    sortOrder: 'asc' | 'desc'
  ): Promise<MaintenanceLogEntity[]>
  updateMaintenanceLog(
    maintenanceLog: MaintenanceLogEntity
  ): Promise<MaintenanceLogEntity>
  countMaintenanceLogs(myUserBikeId: MyUserBikeId): Promise<number>
}
