import { FuelLogEntity } from '../classes/entities/FuelLogEntity'

export interface IFuelLogRepository {
  createFuelLog(fuelLog: FuelLogEntity): Promise<FuelLogEntity>
}
