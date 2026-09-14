import type { ApiResponseUserBikeList } from '@repo/shared-types'

/**
 * バイク一覧APIが返す1台分のバイク情報
 */
export type ActiveBikeSummary = ApiResponseUserBikeList['bikes'][number]

export type ActiveBikeContextType = {
  /** アクティブ車両のID（バイク未登録の場合はnull） */
  activeBikeId: string | null
  /** アクティブ車両の詳細情報（該当バイクが無い場合はnull） */
  activeBike: ActiveBikeSummary | null
  /** ユーザーが登録している全バイク */
  bikes: ActiveBikeSummary[]
  /** バイク一覧取得中かどうか */
  isLoading: boolean
  /** バイク一覧取得時のエラー */
  error: unknown
  /** アクティブ車両を切り替える（localStorageにも永続化される） */
  setActiveBikeId: (bikeId: string) => void
}
