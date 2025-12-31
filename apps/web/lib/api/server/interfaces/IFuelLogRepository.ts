import { FuelLogId, MyUserBikeId } from '@repo/shared-types'
import { FuelLogEntity } from '../entities/FuelLogEntity'
import { FuelLogSearchParams } from '../valueObjects/FuelLogSearchParams'

export interface IFuelLogRepository {
  createFuelLog(fuelLog: FuelLogEntity): Promise<FuelLogEntity>
  findFuelLogs(
    myUserBikeId: MyUserBikeId,
    searchParams: FuelLogSearchParams
  ): Promise<FuelLogEntity[]>
  findFuelLogById(
    fuelLogId: FuelLogId,
    myUserBikeId: MyUserBikeId
  ): Promise<FuelLogEntity | null>
  updateFuelLog(fuelLog: FuelLogEntity): Promise<FuelLogEntity>
}
