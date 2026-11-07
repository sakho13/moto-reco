import type { ApiKeyScope, UserPlan } from '@repo/shared-types'

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
  /** 購入グッズ登録上限 */
  GOODS: 5,
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
} as const

/**
 * 利用可否を判定する機能の種別
 *
 * - `hostEvent`: イベントの開催（#345）
 */
export type FeatureKey = 'hostEvent'

/**
 * ロール・プラン別に利用できる機能（true = 利用可）
 *
 * @remarks
 * 件数の上限では表せない「機能を使えるか」を表す。
 * 判定は `AccountLimitsValue.canUse()` を経由して行うこと。
 */
export const PLAN_FEATURES: Record<
  'GUEST' | UserPlan | 'ADMIN',
  Readonly<Record<FeatureKey, boolean>>
> = {
  GUEST: { hostEvent: false },
  FREE: { hostEvent: false },
  PREMIUM: { hostEvent: true },
  ADMIN: { hostEvent: true },
}

/**
 * プラン別に許可されるAPIキースコープ
 */
export const PLAN_ALLOWED_SCOPES: Record<UserPlan, ApiKeyScope[]> = {
  FREE: ['READ'],
  PREMIUM: ['READ', 'WRITE'],
}

/**
 * プラン別制限値（null = 無制限）
 */
export const PLAN_LIMITS: Record<UserPlan, { apiKey: number | null }> = {
  FREE: {
    apiKey: 1,
  },
  PREMIUM: {
    apiKey: null,
  },
}
