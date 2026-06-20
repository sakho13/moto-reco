import { describe, expect, it } from 'vitest'
import {
  formatInUserTimezone,
  formatPlanSpotOffsetMinutes,
  getNowLocalDateTimeString,
  getTodayDateString,
  toLocalDateTimeString,
} from '@repo/shared-utils'

describe('toLocalDateTimeString', () => {
  it('UTC ISO 文字列をブラウザローカルタイムの datetime-local 形式に変換する', () => {
    // UTC の真夜中
    const utcMidnight = new Date('2024-01-15T00:00:00.000Z')
    const result = toLocalDateTimeString(utcMidnight)
    // "YYYY-MM-DDTHH:mm" 形式であること
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('Date オブジェクトを受け取れる', () => {
    const date = new Date('2024-06-15T12:30:00.000Z')
    const result = toLocalDateTimeString(date)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('ISO 文字列を直接受け取れる', () => {
    const isoStr = '2024-06-15T12:30:00.000Z'
    const result = toLocalDateTimeString(isoStr)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('Date と ISO 文字列で同じ結果になる', () => {
    const isoStr = '2024-03-10T09:00:00.000Z'
    const date = new Date(isoStr)
    expect(toLocalDateTimeString(date)).toBe(toLocalDateTimeString(isoStr))
  })
})

describe('getNowLocalDateTimeString', () => {
  it('datetime-local 形式の文字列を返す', () => {
    const result = getNowLocalDateTimeString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('minuteStep=15 で分が 15 の倍数に丸められる', () => {
    const result = getNowLocalDateTimeString(15)
    const minutes = Number(result.split('T')[1].split(':')[1])
    expect(minutes % 15).toBe(0)
  })

  it('minuteStep=30 で分が 30 の倍数に丸められる', () => {
    const result = getNowLocalDateTimeString(30)
    const minutes = Number(result.split('T')[1].split(':')[1])
    expect(minutes % 30).toBe(0)
  })
})

describe('getTodayDateString', () => {
  it('YYYY-MM-DD 形式の文字列を返す', () => {
    const result = getTodayDateString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('formatPlanSpotOffsetMinutes', () => {
  it('null の場合は "未設定" を返す', () => {
    expect(formatPlanSpotOffsetMinutes(null)).toBe('未設定')
  })

  it('0 の場合は "出発時" を返す', () => {
    expect(formatPlanSpotOffsetMinutes(0)).toBe('出発時')
  })

  it('60分未満は "出発からX分後" を返す', () => {
    expect(formatPlanSpotOffsetMinutes(30)).toBe('出発から30分後')
    expect(formatPlanSpotOffsetMinutes(1)).toBe('出発から1分後')
  })

  it('60分ちょうどは "出発から1時間後" を返す', () => {
    expect(formatPlanSpotOffsetMinutes(60)).toBe('出発から1時間後')
  })

  it('60分を超え端数なしは "出発からX時間後" を返す', () => {
    expect(formatPlanSpotOffsetMinutes(120)).toBe('出発から2時間後')
  })

  it('時間と分の両方がある場合は "出発からX時間Y分後" を返す', () => {
    expect(formatPlanSpotOffsetMinutes(90)).toBe('出発から1時間30分後')
    expect(formatPlanSpotOffsetMinutes(75)).toBe('出発から1時間15分後')
  })
})

describe('formatInUserTimezone', () => {
  it('UTC 日時を Asia/Tokyo タイムゾーンでフォーマットする', () => {
    // UTC 2024-01-15 00:00:00 → JST 2024-01-15 09:00:00
    const utcDate = new Date('2024-01-15T00:00:00.000Z')
    const result = formatInUserTimezone(
      utcDate,
      'Asia/Tokyo',
      'yyyy-MM-dd HH:mm'
    )
    expect(result).toBe('2024-01-15 09:00')
  })

  it('UTC 日時を America/New_York タイムゾーンでフォーマットする', () => {
    // UTC 2024-01-15 00:00:00 → EST 2024-01-14 19:00:00
    const utcDate = new Date('2024-01-15T00:00:00.000Z')
    const result = formatInUserTimezone(
      utcDate,
      'America/New_York',
      'yyyy-MM-dd HH:mm'
    )
    expect(result).toBe('2024-01-14 19:00')
  })

  it('ISO 文字列を直接受け取れる', () => {
    const isoStr = '2024-06-15T15:00:00.000Z'
    const result = formatInUserTimezone(isoStr, 'Asia/Tokyo', 'HH:mm')
    expect(result).toBe('00:00')
  })
})
