import {
  ApiV1Error,
  IMaintenanceLogRepository,
  IMyUserBikeRepository,
  MaintenanceScheduleCalculationService,
} from '@repo/shared-domain'
import type {
  MaintenanceScheduleForecast,
  MyUserBikeId,
  UserId,
} from '@repo/shared-types'
import { MAINTENANCE_ITEMS_MASTER } from '../constants/maintenanceItems'

type GetMaintenanceScheduleParams = {
  myUserBikeId: MyUserBikeId
  userId: UserId
  /** 上位N件に絞る場合に指定 */
  limit?: number
  /** 算出基準時刻。テスト時以外は省略してよい（省略時は現在時刻） */
  now?: Date
}

/**
 * 点検予定（メンテナンス項目ごとの次回時期）の取得を担当するサービス
 *
 * @remarks
 * 算出そのものは `@repo/shared-domain` の
 * `MaintenanceScheduleCalculationService`（純粋なドメインロジック）に委譲し、
 * このクラスはリポジトリからの取得・アクセス権限チェック・
 * マスタデータの引き渡しのみを担う。
 *
 * #151（メンテナンス項目マスタのDB管理化）が完了した際は、
 * `MAINTENANCE_ITEMS_MASTER`（定数）の参照箇所をリポジトリ経由の取得に
 * 差し替えるだけでよい。
 */
export class MaintenanceScheduleService {
  constructor(
    private myUserBikeRepository: IMyUserBikeRepository,
    private maintenanceLogRepository: IMaintenanceLogRepository,
    private calculationService: MaintenanceScheduleCalculationService = new MaintenanceScheduleCalculationService()
  ) {}

  public async getMaintenanceSchedule(
    params: GetMaintenanceScheduleParams
  ): Promise<MaintenanceScheduleForecast[]> {
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      params.myUserBikeId,
      params.userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    const logs = await this.maintenanceLogRepository.findAllMaintenanceLogs(
      params.myUserBikeId,
      'desc'
    )

    const forecasts = this.calculationService.calculate({
      currentMileage: myUserBike.totalMileage,
      now: params.now ?? new Date(),
      masterItems: MAINTENANCE_ITEMS_MASTER,
      maintenanceLogs: logs.map((log) => ({
        performedAt: log.performedAt,
        mileage: log.mileage,
        types: log.items.map((item) => item.maintenanceType),
      })),
    })

    return params.limit ? forecasts.slice(0, params.limit) : forecasts
  }
}
