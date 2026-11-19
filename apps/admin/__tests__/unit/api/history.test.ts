import { describe, expect, test } from 'vitest'
import {
  buildBikeLabel,
  resolveSortField,
  toMyBikeSummary,
} from '@/lib/api/history'

const buildMyBike = (
  overrides: Partial<Parameters<typeof buildBikeLabel>[0]> = {}
): Parameters<typeof buildBikeLabel>[0] => ({
  id: 'bike-1',
  nickname: '相棒',
  user: { id: 'user-1', name: 'たろう' },
  userBike: {
    bike: { modelName: 'CB400SF', manufacturer: { name: 'ホンダ' } },
  },
  ...overrides,
})

describe('buildBikeLabel()', () => {
  test('ニックネームがあればそれを返す', () => {
    expect(buildBikeLabel(buildMyBike())).toBe('相棒')
  })

  test('ニックネームが空ならメーカー名とモデル名を返す', () => {
    expect(buildBikeLabel(buildMyBike({ nickname: null }))).toBe(
      'ホンダ CB400SF'
    )
    expect(buildBikeLabel(buildMyBike({ nickname: '  ' }))).toBe(
      'ホンダ CB400SF'
    )
  })

  test('ニックネームも車種もなければ「名称未設定」を返す', () => {
    expect(
      buildBikeLabel(buildMyBike({ nickname: null, userBike: { bike: null } }))
    ).toBe('名称未設定')
  })
})

describe('toMyBikeSummary()', () => {
  test('マイバイクとユーザーの項目を平らにして返す', () => {
    expect(toMyBikeSummary(buildMyBike())).toEqual({
      myBikeId: 'bike-1',
      bikeLabel: '相棒',
      userId: 'user-1',
      userName: 'たろう',
    })
  })
})

describe('resolveSortField()', () => {
  const allowed = ['createdAt', 'refueledAt'] as const

  test('許可された項目はそのまま返す', () => {
    expect(resolveSortField('refueledAt', allowed)).toBe('refueledAt')
  })

  test('許可されていない項目は先頭の項目を返す', () => {
    expect(resolveSortField('price', allowed)).toBe('createdAt')
    expect(resolveSortField('', allowed)).toBe('createdAt')
  })
})
