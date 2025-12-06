import { MyUserBikeId } from '@shared-types/index'
import { MyUserBikeFuelLogEntity } from '../classes/entities/MyUserBikeFuelLogEntity'

export interface IMyUserBikeFuelLogRepository {
  createFuelLog(
    myUserBikeId: MyUserBikeId,
    fuelLog: MyUserBikeFuelLogEntity
  ): Promise<MyUserBikeFuelLogEntity>
}
