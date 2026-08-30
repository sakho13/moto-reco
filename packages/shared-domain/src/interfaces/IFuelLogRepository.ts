import { FuelLogId, MyUserBikeId, TouringId } from '@repo/shared-types'
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
  /**
   * 指定したツーリングに紐づく給油履歴を、給油日時の範囲によらず全件取得する
   */
  findFuelLogsByTouringId(
    touringId: TouringId,
    myUserBikeId: MyUserBikeId
  ): Promise<FuelLogEntity[]>
  updateFuelLog(fuelLog: FuelLogEntity): Promise<FuelLogEntity>
  deleteFuelLog(fuelLogId: FuelLogId, myUserBikeId: MyUserBikeId): Promise<void>
  updateFuelLogTouringId(
    fuelLogId: FuelLogId,
    myUserBikeId: MyUserBikeId,
    touringId: TouringId | null
  ): Promise<FuelLogEntity>
  updateMultipleFuelLogsTouringId(
    fuelLogIds: FuelLogId[],
    myUserBikeId: MyUserBikeId,
    touringId: TouringId | null
  ): Promise<void>
  countFuelLogs(myUserBikeId: MyUserBikeId): Promise<number>
}
