import type { FuelLogPeriod } from '@repo/shared-types'

/**
 * アプリバージョン
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev'

/**
 * アプリ名
 */
export const APP_NAME = 'MotoReco'

/**
 * サイトURL
 */
export const SITE_URL = 'https://moto-reco.com'

/**
 * WebアプリのベースURL（実行時オリジン）
 *
 * @remarks
 * OAuth Discoveryメタデータなど、ngrok等のトンネル経由でローカル検証する際に
 * 実行時のオリジンへ差し替えたい箇所で使用する。
 * `NEXT_PUBLIC_WEB_URL` が未設定の場合は本番相当の `SITE_URL` にフォールバックする。
 */
export const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? SITE_URL

/**
 * GoogleフォームのアンケートフォームURL
 */
export const GOOGLE_QA_FORM_URL = 'https://forms.gle/WDMmUSyKWUMdnQ8u7'

/**
 * プラン別の登録件数制限値
 *
 * @remarks
 * 定義本体は `@repo/shared-domain` の AccountLimitsValue が単一の情報源として持つため、
 * ここでは再エクスポートのみ行う。
 */
export {
  GUEST_ACCOUNT_LIMITS,
  FREE_USER_LIMITS,
  PREMIUM_USER_LIMITS,
  PLAN_ALLOWED_SCOPES,
  PLAN_LIMITS,
} from '@repo/shared-domain'

/**
 * 給油履歴の期間フィルタの選択肢
 *
 * @remarks
 * `components/bike/BikeCarteControls`（愛車カルテ）・給油履歴ページの
 * モバイル版グラフの期間セレクト・`components/bike/FuelLedgerSection`
 * （PC版台帳。独自の「全期間」を先頭に足して使う）が共有する単一の情報源。
 * 以前はこの配列を画面ごとに個別に持っており、月数の表記が一部だけ
 * 「か月」になるなど、同じ選択肢のはずが表記ずれを起こしていた。
 */
export const FUEL_LOG_PERIOD_OPTIONS: {
  value: FuelLogPeriod
  label: string
}[] = [
  { value: 'latest-year', label: '最新の履歴から1年' },
  { value: 'latest-month', label: '最新の履歴から1ヶ月' },
  { value: 'past-year', label: '現在日時から直近1年' },
  { value: 'past-month', label: '現在日時から直近1ヶ月' },
]
