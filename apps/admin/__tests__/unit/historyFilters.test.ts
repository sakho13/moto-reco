import dayjs from 'dayjs'
import { describe, expect, test } from 'vitest'
import { buildHistoryFilters, getDateRangeValue } from '@/lib/historyFilters'

describe('buildHistoryFilters()', () => {
  test('入力された値と期間を eq のフィルタにする', () => {
    const filters = buildHistoryFilters({ q: 'たろう', status: 'STARTED' }, [
      dayjs('2026-11-01'),
      dayjs('2026-11-03'),
    ])

    expect(filters).toEqual([
      { field: 'q', operator: 'eq', value: 'たろう' },
      { field: 'status', operator: 'eq', value: 'STARTED' },
      { field: 'from', operator: 'eq', value: '2026-11-01' },
      { field: 'to', operator: 'eq', value: '2026-11-03' },
    ])
  })

  test('空の項目も value: undefined で返し、前回の条件を消せるようにする', () => {
    const filters = buildHistoryFilters({ q: '', type: undefined }, null)

    expect(filters).toEqual([
      { field: 'q', operator: 'eq', value: undefined },
      { field: 'type', operator: 'eq', value: undefined },
      { field: 'from', operator: 'eq', value: undefined },
      { field: 'to', operator: 'eq', value: undefined },
    ])
  })

  test('期間は片方だけでもよい', () => {
    const filters = buildHistoryFilters({}, [null, dayjs('2026-11-03')])

    expect(filters).toEqual([
      { field: 'from', operator: 'eq', value: undefined },
      { field: 'to', operator: 'eq', value: '2026-11-03' },
    ])
  })
})

describe('getDateRangeValue()', () => {
  test('from / to のフィルタから期間欄の値を作る', () => {
    const range = getDateRangeValue([
      { field: 'q', operator: 'eq', value: 'たろう' },
      { field: 'from', operator: 'eq', value: '2026-11-01' },
      { field: 'to', operator: 'eq', value: '2026-11-03' },
    ])

    expect(range?.map((d) => d?.format('YYYY-MM-DD') ?? null)).toEqual([
      '2026-11-01',
      '2026-11-03',
    ])
  })

  test('片方だけなら、もう片方は null', () => {
    const range = getDateRangeValue([
      { field: 'to', operator: 'eq', value: '2026-11-03' },
    ])

    expect(range?.map((d) => d?.format('YYYY-MM-DD') ?? null)).toEqual([
      null,
      '2026-11-03',
    ])
  })

  test('期間のフィルタが無ければ undefined', () => {
    expect(
      getDateRangeValue([{ field: 'q', operator: 'eq', value: 'たろう' }])
    ).toBeUndefined()
    expect(getDateRangeValue([])).toBeUndefined()
  })

  test('buildHistoryFilters() の結果から元の期間に戻せる', () => {
    const filters = buildHistoryFilters({}, [
      dayjs('2026-11-01'),
      dayjs('2026-11-03'),
    ])

    expect(
      getDateRangeValue(filters)?.map((d) => d?.format('YYYY-MM-DD') ?? null)
    ).toEqual(['2026-11-01', '2026-11-03'])
  })
})
