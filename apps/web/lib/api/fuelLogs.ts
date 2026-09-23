import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseFuelLogList,
  SuccessResponse,
} from '@repo/shared-types'
import {
  buildPreviousFuelLogQuery,
  type PreviousFuelLogDetail,
} from '../fuelLogSheet'
import { authenticatedFetch } from './client'

/**
 * 選択した給油日時（refueledAt）以前で最も新しい給油ログを、サーバーへ直接
 * 問い合わせて解決する
 *
 * @remarks
 * `resolveSubmitPreviousMileage`（登録時のpreviousMileage補完）と、給油記入票の
 * ライブ計器・「前回の控え」パネル（選択日時に追従させる表示）の両方から共通で
 * 使う（Issue #575 レビュー指摘: バックデート時の区間距離0km化バグ、および
 * ライブ計器の表示と保存値の食い違い）。
 *
 * {@link buildPreviousFuelLogQuery} で組み立てた日付範囲クエリ
 * （`startDate`＝エポック 〜 `endDate`＝選択日時、`sort-order=desc`・`per-size=1`）
 * を直接叩くため、直近数件のウィンドウに依存せず、給油履歴が何件あっても
 * 「選択日時以前で最も新しいログ」を確実に解決できる。該当ログが無い場合は
 * null（＝選択日時以前に給油記録が存在しない＝実質的な初回給油）を返す。
 *
 * @throws {ApiV1Error} 通信・サーバーエラー時。呼び出し元は無言でフォールバック
 * せず、ユーザーにエラーを表示して保存を中止すること。
 */
export async function fetchPreviousFuelLog(
  bikeId: string,
  refueledAt: string
): Promise<PreviousFuelLogDetail | null> {
  const query = buildPreviousFuelLogQuery(refueledAt)
  const response = await authenticatedFetch(
    `/api/v1/user-bike/bike/${bikeId}/fuel-logs?${query}`,
    { method: 'GET' }
  )
  if (!response.ok) {
    const errorData = await response.json()
    throw new ApiV1Error(
      errorData.errorCode || 'SERVER_ERROR',
      errorData.message || '前回の給油履歴の確認に失敗しました'
    )
  }
  const json =
    (await response.json()) as SuccessResponse<ApiResponseFuelLogList>
  const entry = json.data[0]
  return entry
    ? {
        mileage: entry.mileage,
        isFullTank: entry.isFullTank,
        refueledAt: entry.refueledAt,
        amount: entry.amount,
        totalPrice: entry.totalPrice,
        fuelEfficiency: entry.fuelEfficiency,
        pricePerLiter: entry.pricePerLiter,
      }
    : null
}
