import { User } from '@repo/shared-types'

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
    bike: 'ゲストアカウントはバイクを1台まで登録できます',
    fuelLog: 'ゲストアカウントは給油履歴を5件まで登録できます',
    touring: 'ゲストアカウントはツーリング履歴を2件まで登録できます',
    touringPlan: 'ゲストアカウントはツーリングプランを2件まで登録できます',
    maintenanceLog: 'ゲストアカウントはメンテナンス履歴を2件まで登録できます',
  },
  USER: {
    bike: '無料ユーザーはバイクを2台まで登録できます',
    touringPlan: '無料ユーザーはツーリングプランを10件まで登録できます',
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
      return new AccountLimitsValue(role, 1, 5, 2, 2, 2)
    }
    if (role === 'USER') {
      return new AccountLimitsValue(role, 2, null, null, 10, null)
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
