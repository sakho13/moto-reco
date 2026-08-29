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
