import { MyUserBikeId, TouringPlan, TouringPlanId } from '@repo/shared-types'

/**
 * ツーリングプラン（再利用可能なルートテンプレート）を表すエンティティ
 */
export class TouringPlanEntity {
  private _value: TouringPlan

  constructor(plan: TouringPlan) {
    if (plan.title.trim().length === 0) {
      throw new Error('タイトルは1文字以上である必要があります')
    }

    if (plan.title.length > 100) {
      throw new Error('タイトルは100文字以内である必要があります')
    }

    if (plan.departAt > plan.returnAt) {
      throw new Error('出発予定日時は帰着予定日時以前である必要があります')
    }

    this._value = plan
  }

  public get id(): TouringPlanId {
    return this._value.touringPlanId
  }

  public get myUserBikeId(): MyUserBikeId {
    return this._value.myUserBikeId
  }

  public get title(): string {
    return this._value.title
  }

  public get departAt(): Date {
    return this._value.departAt
  }

  public get returnAt(): Date {
    return this._value.returnAt
  }

  public toJson(): TouringPlan {
    return this._value
  }
}
