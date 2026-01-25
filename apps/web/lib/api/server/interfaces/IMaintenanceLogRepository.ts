import { MaintenanceLogId, MyUserBikeId } from '@repo/shared-types'
import { MaintenanceLogEntity } from '../entities/MaintenanceLogEntity'

export interface IMaintenanceLogRepository {
  createMaintenanceLog(
    maintenanceLog: MaintenanceLogEntity
  ): Promise<MaintenanceLogEntity>
  findMaintenanceLogById(
    maintenanceLogId: MaintenanceLogId,
    myUserBikeId: MyUserBikeId
  ): Promise<MaintenanceLogEntity | null>
  updateMaintenanceLog(
    maintenanceLog: MaintenanceLogEntity
  ): Promise<MaintenanceLogEntity>
}
