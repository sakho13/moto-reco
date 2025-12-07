import { MyUserBikeId } from '@shared-types/index'
import { FuelLogEntity } from '../classes/entities/FuelLogEntity'
import { FuelLogSearchParams } from '../classes/valueObjects/FuelLogSearchParams'

export interface IFuelLogRepository {
  createFuelLog(fuelLog: FuelLogEntity): Promise<FuelLogEntity>
  findFuelLogs(
    myUserBikeId: MyUserBikeId,
    searchParams: FuelLogSearchParams
  ): Promise<FuelLogEntity[]>
}
