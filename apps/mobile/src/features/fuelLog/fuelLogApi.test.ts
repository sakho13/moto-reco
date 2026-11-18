import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({ apiClient: {} }))

const { getFuelLogDetailPath, getFuelLogPagePath, isFuelLogKeyOf } =
  await import('./fuelLogApi')

/** useSWRInfinite が一覧のキーの先頭に付ける印 */
const INFINITE_KEY_PREFIX = '$inf$'

describe('getFuelLogPagePath', () => {
  it('ページと件数、給油日時の新しい順の指定を付ける', () => {
    expect(getFuelLogPagePath('bike-1', 2)).toBe(
      '/api/v1/user-bike/bike/bike-1/fuel-logs?page=2&per-size=20&sort-by=refueled-at&sort-order=desc'
    )
  })
})

describe('isFuelLogKeyOf', () => {
  it('同じ愛車の一覧（useSWRInfinite のキー）と詳細のキーに一致する', () => {
    const infiniteKey = INFINITE_KEY_PREFIX + getFuelLogPagePath('bike-1', 1)
    expect(isFuelLogKeyOf('bike-1', infiniteKey)).toBe(true)
    expect(
      isFuelLogKeyOf('bike-1', getFuelLogDetailPath('bike-1', 'log-1'))
    ).toBe(true)
  })

  it('別の愛車や、給油記録以外のキーには一致しない', () => {
    expect(isFuelLogKeyOf('bike-1', getFuelLogPagePath('bike-2', 1))).toBe(
      false
    )
    expect(isFuelLogKeyOf('bike-1', '/api/v1/user-bike/bikes')).toBe(false)
    expect(isFuelLogKeyOf('bike-1', ['array-key'])).toBe(false)
  })
})
