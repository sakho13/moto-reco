import { describe, expect, test } from 'vitest'
import {
  createMyUserBikeId,
  createTouringPlanId,
  TouringPlan,
} from '@repo/shared-types'
import { TouringPlanEntity } from '@/lib/api/server/entities/TouringPlanEntity'

const baseProps = (overrides: Partial<TouringPlan> = {}): TouringPlan => ({
  touringPlanId: createTouringPlanId('plan-1'),
  myUserBikeId: createMyUserBikeId('bike-1'),
  title: '日帰り箱根ツーリング',
  departAt: new Date('2026-07-01T08:00:00.000Z'),
  returnAt: new Date('2026-07-01T18:00:00.000Z'),
  ...overrides,
})

describe('TouringPlanEntity', () => {
  test('正常な値で生成できる', () => {
    const entity = new TouringPlanEntity(baseProps())

    expect(entity.id).toBe('plan-1')
    expect(entity.myUserBikeId).toBe('bike-1')
    expect(entity.title).toBe('日帰り箱根ツーリング')
    expect(entity.departAt).toEqual(new Date('2026-07-01T08:00:00.000Z'))
    expect(entity.returnAt).toEqual(new Date('2026-07-01T18:00:00.000Z'))
  })

  test('toJsonで内部値をそのまま取得できる', () => {
    const props = baseProps()
    const entity = new TouringPlanEntity(props)

    expect(entity.toJson()).toEqual(props)
  })

  test('タイトルが空文字の場合はエラーになる', () => {
    expect(() => new TouringPlanEntity(baseProps({ title: '' }))).toThrow(
      'タイトルは1文字以上である必要があります'
    )
  })

  test('タイトルが空白文字のみの場合はエラーになる', () => {
    expect(() => new TouringPlanEntity(baseProps({ title: '   ' }))).toThrow(
      'タイトルは1文字以上である必要があります'
    )
  })

  test('タイトルが100文字を超える場合はエラーになる', () => {
    expect(
      () => new TouringPlanEntity(baseProps({ title: 'あ'.repeat(101) }))
    ).toThrow('タイトルは100文字以内である必要があります')
  })

  test('タイトルが100文字の場合はエラーにならない', () => {
    expect(
      () => new TouringPlanEntity(baseProps({ title: 'あ'.repeat(100) }))
    ).not.toThrow()
  })

  test('出発予定日時が帰着予定日時より後の場合はエラーになる', () => {
    expect(
      () =>
        new TouringPlanEntity(
          baseProps({
            departAt: new Date('2026-07-01T18:00:00.000Z'),
            returnAt: new Date('2026-07-01T08:00:00.000Z'),
          })
        )
    ).toThrow('出発予定日時は帰着予定日時以前である必要があります')
  })

  test('出発予定日時と帰着予定日時が同一の場合はエラーにならない', () => {
    const sameDate = new Date('2026-07-01T08:00:00.000Z')
    expect(
      () =>
        new TouringPlanEntity(
          baseProps({ departAt: sameDate, returnAt: sameDate })
        )
    ).not.toThrow()
  })
})
