import { describe, expect, test } from 'vitest'
import { BikeSearchParams } from '@repo/shared-domain'

describe('BikeSearchParams', () => {
  describe('page', () => {
    test('未指定の場合は 1 になる', () => {
      const params = new BikeSearchParams({})
      expect(params.page).toBe(1)
      expect(params.skip).toBe(0)
    })

    test('1 以上の整数はそのまま使われる', () => {
      const params = new BikeSearchParams({ page: 3, pageSize: 10 })
      expect(params.page).toBe(3)
      expect(params.skip).toBe(20)
    })

    test.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
      '不正値（%s）は 1 に丸められ、skip が負や非整数にならない',
      (page) => {
        const params = new BikeSearchParams({ page, pageSize: 20 })
        expect(params.page).toBe(1)
        expect(params.skip).toBe(0)
      }
    )
  })

  describe('pageSize', () => {
    test('未指定の場合は 20 になる', () => {
      expect(new BikeSearchParams({}).take).toBe(20)
    })

    test('1〜100 の整数はそのまま使われる', () => {
      expect(new BikeSearchParams({ pageSize: 50 }).take).toBe(50)
    })

    test('100 を超える場合は 100 に丸められる', () => {
      expect(new BikeSearchParams({ pageSize: 101 }).take).toBe(100)
      expect(
        new BikeSearchParams({ pageSize: Number.POSITIVE_INFINITY }).take
      ).toBe(100)
    })

    test.each([0, -1, 1.5, Number.NaN])(
      '不正値（%s）は既定値 20 になる',
      (pageSize) => {
        expect(new BikeSearchParams({ pageSize }).take).toBe(20)
      }
    )
  })
})
