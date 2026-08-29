import { describe, expect, test } from 'vitest'
import { TouringPlanEntity } from '@repo/shared-domain'
import {
  createMyUserBikeId,
  createTouringPlanId,
  TouringPlan,
} from '@repo/shared-types'

const baseProps = (overrides: Partial<TouringPlan> = {}): TouringPlan => ({
  touringPlanId: createTouringPlanId('plan-1'),
  myUserBikeId: createMyUserBikeId('bike-1'),
  title: '日帰り箱根ツーリング',
  createdAt: new Date('2026-07-01T08:00:00.000Z'),
  updatedAt: new Date('2026-07-01T18:00:00.000Z'),
  ...overrides,
})

describe('TouringPlanEntity', () => {
  test('正常な値で生成できる', () => {
    const entity = new TouringPlanEntity(baseProps())

    expect(entity.id).toBe('plan-1')
    expect(entity.myUserBikeId).toBe('bike-1')
    expect(entity.title).toBe('日帰り箱根ツーリング')
    expect(entity.createdAt).toEqual(new Date('2026-07-01T08:00:00.000Z'))
    expect(entity.updatedAt).toEqual(new Date('2026-07-01T18:00:00.000Z'))
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
})
