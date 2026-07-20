import { describe, expect, test } from 'vitest'
import { MaintenanceLogSearchParams } from '@/lib/api/server/valueObjects/MaintenanceLogSearchParams'

describe('MaintenanceLogSearchParams', () => {
  describe('デフォルト値', () => {
    test('page未指定時は1ページ目扱いになる（skipが0）', () => {
      const params = new MaintenanceLogSearchParams({})
      expect(params.skip).toBe(0)
    })

    test('pageSize未指定時は20件になる', () => {
      const params = new MaintenanceLogSearchParams({})
      expect(params.take).toBe(20)
    })

    test('sortOrder未指定時はdescになる', () => {
      const params = new MaintenanceLogSearchParams({})
      expect(params.sortOrder).toBe('desc')
    })

    test('keyword未指定時はundefinedになる', () => {
      const params = new MaintenanceLogSearchParams({})
      expect(params.keyword).toBeUndefined()
    })
  })

  describe('ページネーション', () => {
    test('page=3, pageSize=10のときskipは20になる', () => {
      const params = new MaintenanceLogSearchParams({ page: 3, pageSize: 10 })
      expect(params.skip).toBe(20)
      expect(params.take).toBe(10)
    })

    test('page=0以下は1ページ目扱いになる', () => {
      const params = new MaintenanceLogSearchParams({ page: 0 })
      expect(params.skip).toBe(0)
    })

    test('pageSizeが100を超える場合は100に丸められる', () => {
      const params = new MaintenanceLogSearchParams({ pageSize: 200 })
      expect(params.take).toBe(100)
    })

    test('pageSizeが1未満の場合は20に丸められる', () => {
      const params = new MaintenanceLogSearchParams({ pageSize: 0 })
      expect(params.take).toBe(20)
    })
  })

  describe('keyword', () => {
    test('指定した値がそのまま保持される', () => {
      const params = new MaintenanceLogSearchParams({ keyword: 'オイル交換' })
      expect(params.keyword).toBe('オイル交換')
    })
  })

  describe('sortOrder', () => {
    test('ascを指定できる', () => {
      const params = new MaintenanceLogSearchParams({ sortOrder: 'asc' })
      expect(params.sortOrder).toBe('asc')
    })
  })
})
