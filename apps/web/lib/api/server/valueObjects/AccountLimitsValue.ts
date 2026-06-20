import { User } from '@repo/shared-types'
import { FREE_USER_LIMITS, GUEST_ACCOUNT_LIMITS } from '../../../statics'

type Role = User['role']

/** 制限件数チェックの対象種別 */
export type LimitKey =
  | 'bike'
  | 'fuelLog'
  | 'touring'
  | 'touringPlan'
  | 'maintenanceLog'

type LimitMessages = Partial<Record<LimitKey, string>>

const LIMIT_MESSAGES: Partial<Record<Role, LimitMessages>> = {
  GUEST: {
    bike: `ゲストアカウントはバイクを${GUEST_ACCOUNT_LIMITS.BIKE}台まで登録できます`,
    fuelLog: `ゲストアカウントは給油履歴を${GUEST_ACCOUNT_LIMITS.FUEL_LOG}件まで登録できます`,
    touring: `ゲストアカウントはツーリング履歴を${GUEST_ACCOUNT_LIMITS.TOURING}件まで登録できます`,
    touringPlan: `ゲストアカウントはツーリングプランを${GUEST_ACCOUNT_LIMITS.TOURING_PLAN}件まで登録できます`,
    maintenanceLog: `ゲストアカウントはメンテナンス履歴を${GUEST_ACCOUNT_LIMITS.MAINTENANCE_LOG}件まで登録できます`,
  },
  USER: {
    bike: `無料ユーザーはバイクを${FREE_USER_LIMITS.BIKE}台まで登録できます`,
    touringPlan: `無料ユーザーはツーリングプランを${FREE_USER_LIMITS.TOURING_PLAN}件まで登録できます`,
  },
}

/**
 * ユーザーロールに対応する登録件数制限を保持するバリューオブジェクト。
 * null は制限なし（無制限）を表す。
 */
export class AccountLimitsValue {
  private constructor(
    private readonly _role: Role,
    readonly bike: number | null,
    readonly fuelLog: number | null,
    readonly touring: number | null,
    readonly touringPlan: number | null,
    readonly maintenanceLog: number | null
  ) {}

  /**
   * ロールから制限値オブジェクトを生成する
   */
  static from(role: Role): AccountLimitsValue {
    if (role === 'GUEST') {
      return new AccountLimitsValue(
        role,
        GUEST_ACCOUNT_LIMITS.BIKE,
        GUEST_ACCOUNT_LIMITS.FUEL_LOG,
        GUEST_ACCOUNT_LIMITS.TOURING,
        GUEST_ACCOUNT_LIMITS.TOURING_PLAN,
        GUEST_ACCOUNT_LIMITS.MAINTENANCE_LOG
      )
    }
    if (role === 'USER') {
      return new AccountLimitsValue(
        role,
        FREE_USER_LIMITS.BIKE,
        null,
        null,
        FREE_USER_LIMITS.TOURING_PLAN,
        null
      )
    }
    // ADMIN: 全て無制限
    return new AccountLimitsValue(role, null, null, null, null, null)
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
    return LIMIT_MESSAGES[this._role]?.[type] ?? '登録件数の上限に達しました'
  }
}
