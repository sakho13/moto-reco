import { handleApiResponse } from '@repo/api-client'
import {
  buildPreviousFuelLogQuery,
  type PreviousFuelLogSummary,
} from '@repo/shared-domain/fuelLogSheet'
import type {
  ApiResponseFuelLogDetail,
  ApiResponseFuelLogList,
  FuelLogRegisterRequest,
  FuelLogUpdateRequest,
  SuccessResponse,
} from '@repo/shared-types'
import { apiClient } from '@/lib/api'

/** 一覧の1ページの件数 */
export const FUEL_LOG_PAGE_SIZE = 20

/** 給油記録のエンドポイント（登録・更新・削除と一覧で共通） */
function fuelLogsPath(myUserBikeId: string) {
  return `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs` as const
}

/**
 * 給油履歴一覧の1ページ分の取得先（SWR のキーにも使う）
 *
 * @remarks
 * 給油日時の新しい順に並べる。
 */
export function getFuelLogPagePath(myUserBikeId: string, page: number): string {
  const query = new URLSearchParams({
    page: String(page),
    'per-size': String(FUEL_LOG_PAGE_SIZE),
    'sort-by': 'refueled-at',
    'sort-order': 'desc',
  })
  return `${fuelLogsPath(myUserBikeId)}?${query.toString()}`
}

/** 給油記録1件の取得先（SWR のキーにも使う） */
export function getFuelLogDetailPath(
  myUserBikeId: string,
  fuelLogId: string
): string {
  return `${fuelLogsPath(myUserBikeId)}/${fuelLogId}`
}

/**
 * クエリ付きのパスを GET する
 *
 * @remarks
 * `apiGet` の型付きのエンドポイント一覧はクエリ付きのパスを受け付けないため、
 * `authenticatedFetch` で取得してレスポンスの型を指定する。
 */
async function getJson<T>(path: string): Promise<T> {
  const response = await apiClient.authenticatedFetch(path, { method: 'GET' })
  const json = await handleApiResponse<SuccessResponse<T>>(response)
  return json.data
}

/** 給油履歴一覧の1ページ分を取得する */
export function fetchFuelLogPage(
  path: string
): Promise<ApiResponseFuelLogList> {
  return getJson<ApiResponseFuelLogList>(path)
}

/** 給油記録1件を取得する */
export function fetchFuelLogDetail(
  path: string
): Promise<ApiResponseFuelLogDetail> {
  return getJson<ApiResponseFuelLogDetail>(path)
}

/**
 * 指定した給油日時以前で最も新しい給油記録を取得する
 *
 * @remarks
 * 登録時の前回走行距離の補完と、燃費の目安の算出に使う（Web の
 * `fetchPreviousFuelLog` と同じ問い合わせ）。該当する記録が無ければ
 * （実質的に初回の給油なら） null を返す。
 */
export async function fetchPreviousFuelLog(
  myUserBikeId: string,
  refueledAt: Date
): Promise<PreviousFuelLogSummary | null> {
  const query = buildPreviousFuelLogQuery(refueledAt.toISOString())
  const logs = await getJson<ApiResponseFuelLogList>(
    `${fuelLogsPath(myUserBikeId)}?${query}`
  )
  const latest = logs[0]
  return latest
    ? { mileage: latest.mileage, isFullTank: latest.isFullTank }
    : null
}

/** 給油記録を登録する */
export async function registerFuelLog(
  myUserBikeId: string,
  request: FuelLogRegisterRequest
): Promise<void> {
  await apiClient.apiPost(fuelLogsPath(myUserBikeId), request)
}

/** 給油記録を更新する */
export async function updateFuelLog(
  myUserBikeId: string,
  request: FuelLogUpdateRequest
): Promise<void> {
  await apiClient.apiPatch(fuelLogsPath(myUserBikeId), request)
}

/** 給油記録を削除する */
export async function deleteFuelLog(
  myUserBikeId: string,
  fuelLogId: string
): Promise<void> {
  await apiClient.apiDelete(fuelLogsPath(myUserBikeId), { fuelLogId })
}

/**
 * SWR のキーが、指定した愛車の給油記録1件（詳細）のものか
 *
 * @remarks
 * 登録・更新・削除の後に、詳細のキャッシュをまとめて取り直すのに使う。
 * 一覧（`useSWRInfinite`）のキーは SWR がフィルター付きの `mutate` の対象から
 * 外すため、ここでは扱わない。一覧は `useSWRInfinite` が返す `mutate` で取り直す。
 */
export function isFuelLogDetailKeyOf(
  myUserBikeId: string,
  key: unknown
): boolean {
  return (
    typeof key === 'string' && key.startsWith(`${fuelLogsPath(myUserBikeId)}/`)
  )
}
