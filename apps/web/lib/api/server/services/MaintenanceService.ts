import { ApiV1Error, IMyUserBikeRepository } from '@repo/shared-domain'
import type { MaintenanceItem, MyUserBikeId, UserId } from '@repo/shared-types'
import { MAINTENANCE_ITEMS_MASTER } from '../constants/maintenanceItems'

/**
 * メンテナンスサービス
 *
 * メンテナンス項目の取得を担当
 */
export class MaintenanceService {
  constructor(private myUserBikeRepository: IMyUserBikeRepository) {}

  /**
   * ユーザバイクのメンテナンス項目一覧を取得
   *
   * @param myUserBikeId ユーザバイクID
   * @param userId ユーザーID（アクセス権限チェック用）
   * @returns メンテナンス項目一覧
   * @throws ApiV1Error バイクが見つからない場合
   */
  public async getMaintenanceItems(
    myUserBikeId: MyUserBikeId,
    userId: UserId
  ): Promise<MaintenanceItem[]> {
    // 1. ユーザバイクの存在確認とアクセス権限チェック
    const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
      myUserBikeId,
      userId
    )

    if (!myUserBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    // 2. メンテナンス項目マスタデータにIDを付与して返却
    // IDは {userBikeId}_{maintenanceType} の形式
    // 将来的には、バイク情報やメンテナンス履歴を考慮した動的な項目を返す
    return MAINTENANCE_ITEMS_MASTER.map((item) => ({
      ...item,
      id: `${myUserBike.userBikeId}_${item.type}`,
    }))
  }
}
