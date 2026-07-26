import { type ApiKeyScope, type User, type UserPlan } from '@repo/shared-types'
import {
  FREE_USER_LIMITS,
  GUEST_ACCOUNT_LIMITS,
  PLAN_ALLOWED_SCOPES,
  PLAN_LIMITS,
  PREMIUM_USER_LIMITS,
} from '../../../statics'

type Role = User['role']

/** 制限件数チェックの対象種別 */
export type LimitKey =
  | 'bike'
  | 'fuelLog'
  | 'touring'
  | 'touringPlan'
  | 'maintenanceLog'
  | 'goods'
  | 'apiKey'

type LimitMessages = Partial<Record<LimitKey, string>>

const GUEST_MESSAGES: LimitMessages = {
  bike: `ゲストアカウントはバイクを${GUEST_ACCOUNT_LIMITS.BIKE}台まで登録できます`,
  fuelLog: `ゲストアカウントは給油履歴を${GUEST_ACCOUNT_LIMITS.FUEL_LOG}件まで登録できます`,
  touring: `ゲストアカウントはツーリング履歴を${GUEST_ACCOUNT_LIMITS.TOURING}件まで登録できます`,
  touringPlan: `ゲストアカウントはツーリングプランを${GUEST_ACCOUNT_LIMITS.TOURING_PLAN}件まで登録できます`,
  maintenanceLog: `ゲストアカウントはメンテナンス履歴を${GUEST_ACCOUNT_LIMITS.MAINTENANCE_LOG}件まで登録できます`,
  goods: `ゲストアカウントはグッズを${GUEST_ACCOUNT_LIMITS.GOODS}件まで登録できます`,
  apiKey: 'ゲストアカウントはAPIキーを発行できません',
}

const FREE_MESSAGES: LimitMessages = {
  bike: `無料ユーザーはバイクを${FREE_USER_LIMITS.BIKE}台まで登録できます`,
  touringPlan: `無料ユーザーはツーリングプランを${FREE_USER_LIMITS.TOURING_PLAN}件まで登録できます`,
  maintenanceLog: `無料ユーザーはメンテナンス履歴を${FREE_USER_LIMITS.MAINTENANCE_LOG}件まで登録できます`,
  apiKey: `無料プランはAPIキーを${PLAN_LIMITS.FREE.apiKey}個まで発行できます`,
}

const PREMIUM_MESSAGES: LimitMessages = {
  bike: `プレミアムユーザーはバイクを${PREMIUM_USER_LIMITS.BIKE}台まで登録できます`,
}

/**
 * ユーザーロールとプランに対応する登録件数制限を保持するバリューオブジェクト。
 * null は制限なし（無制限）を表す。
 */
export class AccountLimitsValue {
  private constructor(
    private readonly _role: Role,
    private readonly _plan: UserPlan | null,
    readonly bike: number | null,
    readonly fuelLog: number | null,
    readonly touring: number | null,
    readonly touringPlan: number | null,
    readonly maintenanceLog: number | null,
    readonly goods: number | null,
    readonly apiKey: number | null,
    readonly allowedScopes: ApiKeyScope[]
  ) {}

  /**
   * ロールとプランから制限値オブジェクトを生成する。
   * GUEST / ADMIN は plan に関わらず固定の制限値を使用する。
   */
  static from(role: Role, plan: UserPlan | null): AccountLimitsValue {
    if (role === 'GUEST') {
      return new AccountLimitsValue(
        role,
        null,
        GUEST_ACCOUNT_LIMITS.BIKE,
        GUEST_ACCOUNT_LIMITS.FUEL_LOG,
        GUEST_ACCOUNT_LIMITS.TOURING,
        GUEST_ACCOUNT_LIMITS.TOURING_PLAN,
        GUEST_ACCOUNT_LIMITS.MAINTENANCE_LOG,
        GUEST_ACCOUNT_LIMITS.GOODS,
        0,
        []
      )
    }
    if (role === 'USER' && plan === 'PREMIUM') {
      return new AccountLimitsValue(
        role,
        plan,
        PREMIUM_USER_LIMITS.BIKE,
        null,
        null,
        PREMIUM_USER_LIMITS.TOURING_PLAN,
        PREMIUM_USER_LIMITS.MAINTENANCE_LOG,
        null,
        PLAN_LIMITS.PREMIUM.apiKey,
        PLAN_ALLOWED_SCOPES.PREMIUM
      )
    }
    if (role === 'USER') {
      // FREE または防御的 null 扱い
      return new AccountLimitsValue(
        role,
        plan,
        FREE_USER_LIMITS.BIKE,
        null,
        null,
        FREE_USER_LIMITS.TOURING_PLAN,
        FREE_USER_LIMITS.MAINTENANCE_LOG,
        null,
        PLAN_LIMITS.FREE.apiKey,
        PLAN_ALLOWED_SCOPES.FREE
      )
    }
    // ADMIN: 全て無制限
    return new AccountLimitsValue(
      role,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      ['READ', 'WRITE']
    )
  }

  /**
   * 現在の件数が上限を超えているか返す
   */
  isOver(type: LimitKey, count: number): boolean {
    const limit = this[type]
    return limit !== null && count >= limit
  }

  /**
   * 上限超過時のエラーメッセージを返す
   */
  limitMessage(type: LimitKey): string {
    if (this._role === 'GUEST') {
      return GUEST_MESSAGES[type] ?? '登録件数の上限に達しました'
    }
    if (this._role === 'USER' && this._plan === 'PREMIUM') {
      return PREMIUM_MESSAGES[type] ?? '登録件数の上限に達しました'
    }
    if (this._role === 'USER') {
      return FREE_MESSAGES[type] ?? '登録件数の上限に達しました'
    }
    return '登録件数の上限に達しました'
  }
}
