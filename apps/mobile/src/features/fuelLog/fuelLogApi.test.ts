import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({ apiClient: {} }))

const { getFuelLogDetailPath, getFuelLogPagePath, isFuelLogDetailKeyOf } =
  await import('./fuelLogApi')

describe('getFuelLogPagePath', () => {
  it('ページと件数、給油日時の新しい順の指定を付ける', () => {
    expect(getFuelLogPagePath('bike-1', 2)).toBe(
      '/api/v1/user-bike/bike/bike-1/fuel-logs?page=2&per-size=20&sort-by=refueled-at&sort-order=desc'
    )
  })
})

describe('isFuelLogDetailKeyOf', () => {
  it('同じ愛車の給油記録の詳細のキーに一致する', () => {
    expect(
      isFuelLogDetailKeyOf('bike-1', getFuelLogDetailPath('bike-1', 'log-1'))
    ).toBe(true)
  })

  it('一覧のページ・別の愛車・給油記録以外のキーには一致しない', () => {
    expect(
      isFuelLogDetailKeyOf('bike-1', getFuelLogPagePath('bike-1', 1))
    ).toBe(false)
    expect(
      isFuelLogDetailKeyOf('bike-1', getFuelLogDetailPath('bike-2', 'log-1'))
    ).toBe(false)
    expect(isFuelLogDetailKeyOf('bike-1', '/api/v1/user-bike/bikes')).toBe(
      false
    )
    expect(isFuelLogDetailKeyOf('bike-1', ['array-key'])).toBe(false)
  })
})
