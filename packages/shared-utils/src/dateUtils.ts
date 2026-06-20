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

/** ローカル時刻で `yyyy/mm/dd` 形式に変換する */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
}

/** ローカル時刻で `yyyy/mm/dd hh:mm` 形式に変換する */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
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
