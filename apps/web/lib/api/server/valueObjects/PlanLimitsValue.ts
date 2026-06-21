import type { UserPlan } from '@repo/shared-types'
import { PLAN_LIMITS, PlanLimitKey } from '../../../statics'

type LimitMessages = Partial<Record<PlanLimitKey, string>>

const PLAN_LIMIT_MESSAGES: Record<UserPlan, LimitMessages> = {
  FREE: {
    apiKey: `無料プランはAPIキーを${PLAN_LIMITS.FREE.apiKey}個まで発行できます`,
  },
  PREMIUM: {},
}

/**
 * 料金プランに対応する機能制限を保持するバリューオブジェクト。
 * null は制限なし（無制限）を表す。
 */
export class PlanLimitsValue {
  private constructor(
    private readonly _plan: UserPlan | undefined,
    readonly apiKey: number | null
  ) {}

  /**
   * プランから制限値オブジェクトを生成する。
   *
   * @remarks
   * plan が undefined / null の場合は全フィールド null（無制限 = ADMIN など）。
   * GUEST の FORBIDDEN 制限はサービス層で別途管理する。
   */
  static from(plan?: UserPlan | null): PlanLimitsValue {
    if (!plan) {
      return new PlanLimitsValue(undefined, null)
    }
    const limits = PLAN_LIMITS[plan]
    return new PlanLimitsValue(plan, limits.apiKey)
  }

  /**
   * 現在の件数が上限を超えているか返す
   */
  isOver(type: PlanLimitKey, count: number): boolean {
    const limit = this[type]
    return limit !== null && count >= limit
  }

  /**
   * 上限超過時のエラーメッセージを返す
   */
  limitMessage(type: PlanLimitKey): string {
    return (
      (this._plan ? PLAN_LIMIT_MESSAGES[this._plan]?.[type] : undefined) ??
      '利用上限に達しました'
    )
  }
}
