import { MaintenanceLogId, MyUserBikeId } from '@repo/shared-types'
import { MaintenanceLogEntity } from '../entities/MaintenanceLogEntity'

export type MaintenanceLogListParams = {
  myUserBikeId: MyUserBikeId
  page: number
  perSize: number
  sortOrder: 'asc' | 'desc'
}

export interface IMaintenanceLogRepository {
  createMaintenanceLog(
    maintenanceLog: MaintenanceLogEntity
  ): Promise<MaintenanceLogEntity>
  findMaintenanceLogById(
    maintenanceLogId: MaintenanceLogId,
    myUserBikeId: MyUserBikeId
  ): Promise<MaintenanceLogEntity | null>
  findMaintenanceLogs(
    params: MaintenanceLogListParams
  ): Promise<MaintenanceLogEntity[]>
  updateMaintenanceLog(
    maintenanceLog: MaintenanceLogEntity
  ): Promise<MaintenanceLogEntity>
  countMaintenanceLogs(myUserBikeId: MyUserBikeId): Promise<number>
}
