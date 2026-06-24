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
 * GoogleフォームのアンケートフォームURL
 */
export const GOOGLE_QA_FORM_URL = 'https://forms.gle/WDMmUSyKWUMdnQ8u7'

/**
 * ゲストアカウントの各種制限値
 */
export const GUEST_ACCOUNT_LIMITS = {
  /** バイク登録上限 */
  BIKE: 1,
  /** 給油履歴登録上限 */
  FUEL_LOG: 5,
  /** ツーリング履歴登録上限 */
  TOURING: 2,
  /** ツーリングプラン登録上限 */
  TOURING_PLAN: 2,
  /** メンテナンス履歴登録上限 */
  MAINTENANCE_LOG: 2,
  /** アカウント有効期間（ミリ秒） */
  TTL_MS: 7 * 24 * 60 * 60 * 1000,
} as const

/**
 * 無料ユーザー（USERロール / FREEプラン）の各種制限値
 */
export const FREE_USER_LIMITS = {
  /** バイク登録上限 */
  BIKE: 2,
  /** ツーリングプラン登録上限 */
  TOURING_PLAN: 10,
  /** メンテナンス履歴登録上限 */
  MAINTENANCE_LOG: 5,
} as const

/**
 * プレミアムユーザー（USERロール / PREMIUMプラン）の各種制限値
 * null は制限なし（無制限）を表す
 */
export const PREMIUM_USER_LIMITS = {
  /** バイク登録上限 */
  BIKE: 10,
  /** ツーリングプラン登録上限（無制限） */
  TOURING_PLAN: null,
  /** メンテナンス履歴登録上限（無制限） */
  MAINTENANCE_LOG: null,
} as const
