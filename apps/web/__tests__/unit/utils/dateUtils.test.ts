import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatInUserTimezone,
  formatPlanSpotOffsetMinutes,
  getNowLocalDateTimeString,
  getTodayDateString,
  isUnsetDate,
  toLocalDateTimeString,
} from '@repo/shared-utils'

describe('formatDate', () => {
  it('yyyy/mm/dd 形式の文字列を返す', () => {
    expect(formatDate('2024-05-18T00:00:00')).toBe('2024/05/18')
  })

  it('一桁の月・日はゼロ埋めする', () => {
    expect(formatDate('2026-01-05T00:00:00')).toBe('2026/01/05')
  })

  it('Date オブジェクトを受け取れる', () => {
    expect(formatDate(new Date(2026, 8, 17))).toBe('2026/09/17')
  })
})

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

describe('isUnsetDate', () => {
  it('null は未設定と判定される', () => {
    expect(isUnsetDate(null)).toBe(true)
  })

  it('undefined は未設定と判定される', () => {
    expect(isUnsetDate(undefined)).toBe(true)
  })

  it('UTCエポック(1970-01-01T00:00:00.000Z)は未設定と判定される', () => {
    expect(isUnsetDate('1970-01-01T00:00:00.000Z')).toBe(true)
    expect(isUnsetDate(new Date('1970-01-01T00:00:00.000Z'))).toBe(true)
  })

  it('UTCエポックのミリ秒値と厳密一致しない場合は未設定と判定されない', () => {
    // 回帰再現（Issue #575 レビュー指摘）: 以前はUTCエポックの前後1日を
    // 許容範囲としていたため、時刻成分が0時ちょうどでない
    // 1970-01-01T09:00:00.000Zや1969-12-31T15:00:00.000Zも「未設定」と
    // 誤判定していた。エポックのミリ秒値そのものと厳密一致する場合のみを
    // 未設定とみなすよう判定を絞ったため、これらは未設定と判定されない。
    expect(isUnsetDate('1970-01-01T09:00:00.000Z')).toBe(false)
    expect(isUnsetDate('1969-12-31T15:00:00.000Z')).toBe(false)
  })

  it('通常の日付は未設定と判定されない', () => {
    expect(isUnsetDate('2024-01-01T00:00:00.000Z')).toBe(false)
    expect(isUnsetDate(new Date('2024-01-01T00:00:00.000Z'))).toBe(false)
  })

  it('エポックより前でも正当に古い日付は未設定と判定されない', () => {
    // 旧車の購入日がエポック誤変換と誤判定されると、
    // 表示が消えるだけでなく編集時に実データまで消去されてしまう
    expect(isUnsetDate('1960-05-18T00:00:00.000Z')).toBe(false)
    expect(isUnsetDate(new Date('1969-06-01T00:00:00.000Z'))).toBe(false)
  })

  it('エポック隣接日（1969-12-31・1970-01-02）ちょうど0時の実際の購入日は未設定と判定されない', () => {
    // 回帰再現（Issue #575 レビュー指摘）: 購入日欄は<input type="date">
    // （日付のみ）由来のため、実際の値は常にUTC 0時ちょうどになる。以前は
    // エポックの前後1日を丸ごと「未設定」扱いにしていたため、1969-12-31や
    // 1970-01-02を実際の購入日とする車両で、編集モーダルの日付欄が空欄になり
    // 他の項目だけ保存するとpurchaseDate: nullが送信されて実データが消えて
    // いた。<input type="date">が生成する値と同じ「日付のみ・0時ちょうど」の
    // 形式で検証する。
    expect(isUnsetDate('1969-12-31T00:00:00.000Z')).toBe(false)
    expect(isUnsetDate(new Date('1969-12-31T00:00:00.000Z'))).toBe(false)
    expect(isUnsetDate('1970-01-02T00:00:00.000Z')).toBe(false)
    expect(isUnsetDate(new Date('1970-01-02T00:00:00.000Z'))).toBe(false)
  })

  it('不正な日付文字列は未設定として扱わない', () => {
    expect(isUnsetDate('invalid-date')).toBe(false)
  })
})
