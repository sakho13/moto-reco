import { MyUserBikeId } from './bike'
import { MaintenanceType } from './maintenance'

export type MaintenanceLogId = string & { readonly __brand: unique symbol }
export const createMaintenanceLogId = (id: string): MaintenanceLogId =>
  id as MaintenanceLogId

export type MaintenanceLogItem = {
  maintenanceType: MaintenanceType
  value: number | null
}

export type MaintenanceLog = {
  maintenanceLogId: MaintenanceLogId
  myUserBikeId: MyUserBikeId
  performedAt: Date
  mileage: number
  memo: string | null
  items: MaintenanceLogItem[]
}
