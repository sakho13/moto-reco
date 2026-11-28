import { describe, expect, test } from 'vitest'
import {
  getJstPeriod,
  listJstDates,
  parseJstDate,
  parseStatsPeriodDays,
  toJstDateRange,
  toJstDateString,
} from '@/lib/jstPeriod'

describe('toJstDateString()', () => {
  test('UTC 14:59 は同じ日、15:00 はJSTで翌日になる', () => {
    expect(toJstDateString(new Date('2026-11-18T14:59:59.999Z'))).toBe(
      '2026-11-18'
    )
    expect(toJstDateString(new Date('2026-11-18T15:00:00.000Z'))).toBe(
      '2026-11-19'
    )
  })
})

describe('parseJstDate()', () => {
  test('JSTの0時を返す', () => {
    expect(parseJstDate('2026-11-19')?.toISOString()).toBe(
      '2026-11-18T15:00:00.000Z'
    )
  })

  test.each(['2026-02-30', '2026-13-01', '2026/11/19', '20261119', ''])(
    '%s は null',
    (value) => {
      expect(parseJstDate(value)).toBeNull()
    }
  )
})

describe('parseStatsPeriodDays()', () => {
  test.each([
    ['7', 7],
    ['30', 30],
    ['90', 90],
  ])('%s は %d', (value, expected) => {
    expect(parseStatsPeriodDays(value)).toBe(expected)
  })

  test.each([null, '', '5', '7.0x', 'abc'])('%s は null', (value) => {
    expect(parseStatsPeriodDays(value)).toBeNull()
  })
})

describe('getJstPeriod()', () => {
  test('JSTの今日を最終日とする7日間と、その直前の7日間を返す', () => {
    const period = getJstPeriod(new Date('2026-11-19T03:00:00Z'), 7)

    expect(period.from).toBe('2026-11-13')
    expect(period.to).toBe('2026-11-19')
    expect(period.start.toISOString()).toBe('2026-11-12T15:00:00.000Z')
    expect(period.end.toISOString()).toBe('2026-11-19T15:00:00.000Z')
    expect(period.previousStart.toISOString()).toBe('2026-11-05T15:00:00.000Z')
  })

  test('UTCでは前日でもJSTで日付が変わっていれば、その日を最終日にする', () => {
    const period = getJstPeriod(new Date('2026-11-18T15:30:00Z'), 30)

    expect(period.to).toBe('2026-11-19')
    expect(period.from).toBe('2026-10-21')
  })
})

describe('listJstDates()', () => {
  test('開始日から指定日数の日付を古い順に返す', () => {
    const start = new Date('2026-10-30T15:00:00Z')

    expect(listJstDates(start, 4)).toEqual([
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
    ])
  })
})

describe('toJstDateRange()', () => {
  test('to の日は終日を含む', () => {
    const range = toJstDateRange('2026-11-01', '2026-11-03')

    expect(range?.gte?.toISOString()).toBe('2026-10-31T15:00:00.000Z')
    expect(range?.lt?.toISOString()).toBe('2026-11-03T15:00:00.000Z')
  })

  test('片方だけでも範囲を作る', () => {
    expect(toJstDateRange('2026-11-01', null)).toEqual({
      gte: new Date('2026-10-31T15:00:00Z'),
    })
    expect(toJstDateRange(null, '2026-11-03')).toEqual({
      lt: new Date('2026-11-03T15:00:00Z'),
    })
  })

  test('どちらも未指定・不正なら undefined', () => {
    expect(toJstDateRange(null, null)).toBeUndefined()
    expect(toJstDateRange('', '')).toBeUndefined()
    expect(toJstDateRange('2026-02-30', 'abc')).toBeUndefined()
  })
})
