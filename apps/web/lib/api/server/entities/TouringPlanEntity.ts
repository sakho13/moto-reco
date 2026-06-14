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

  public get createdAt(): Date {
    return this._value.createdAt
  }

  public get updatedAt(): Date {
    return this._value.updatedAt
  }

  public toJson(): TouringPlan {
    return this._value
  }
}
