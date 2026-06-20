import { formatInTimeZone } from 'date-fns-tz'

const pad = (n: number) => String(n).padStart(2, '0')

/** 現在日時を取得する唯一の関数 */
export const getCurrentDate = (): Date => new Date()

/** 今日の日付を YYYY-MM-DD 形式で返す */
export const getTodayDateString = (): string => {
  const d = getCurrentDate()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 現在の年を返す */
export const getCurrentYear = (): number => getCurrentDate().getFullYear()

/**
 * UTC の Date または ISO 文字列を datetime-local input 向けの "YYYY-MM-DDTHH:mm" 形式に変換する
 *
 * @remarks
 * ブラウザのローカルタイムゾーンで解釈される。フォームの初期値設定に使用する。
 */
export const toLocalDateTimeString = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 現在日時を datetime-local input 向けの "YYYY-MM-DDTHH:mm" 形式で返す
 *
 * @param minuteStep - 分を切り捨てる刻み幅（分単位）。デフォルト 1（丸めなし）
 */
export const getNowLocalDateTimeString = (minuteStep = 1): string => {
  const now = getCurrentDate()
  if (minuteStep > 1) {
    now.setMinutes(Math.floor(now.getMinutes() / minuteStep) * minuteStep, 0, 0)
  }
  return toLocalDateTimeString(now)
}

/**
 * 出発からの経過分数を `"出発から{H}時間{M}分後"` 形式の文字列に整形する
 *
 * @remarks
 * `minutes` が `null` の場合は `"未設定"` を返す。`0` の場合は `"出発時"` を返す。
 */
export const formatPlanSpotOffsetMinutes = (minutes: number | null): string => {
  if (minutes === null) return '未設定'
  if (minutes === 0) return '出発時'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `出発から${mins}分後`
  if (mins === 0) return `出発から${hours}時間後`
  return `出発から${hours}時間${mins}分後`
}

/**
 * Date または ISO 文字列をブラウザのローカルタイムゾーンで "yyyy/mm/dd hh:mm:ss" 形式に変換する
 *
 * @remarks
 * フロント表示用の統一フォーマット。ローカルタイムゾーンを使用する。
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * UTC 日時を指定タイムゾーンでフォーマットする
 *
 * @param date - UTC の Date または ISO 文字列
 * @param timezone - IANA タイムゾーン識別子（例: `"Asia/Tokyo"`）
 * @param formatStr - date-fns のフォーマット文字列（例: `"yyyy-MM-dd HH:mm"`）
 */
export const formatInUserTimezone = (
  date: Date | string,
  timezone: string,
  formatStr: string
): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatInTimeZone(d, timezone, formatStr)
}
