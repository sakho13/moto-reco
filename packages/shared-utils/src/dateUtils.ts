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
 * 「未設定」とみなす日付の許容範囲（UTC エポックの前後1日）
 *
 * @remarks
 * `z.coerce.date()` に `null` を渡すと `new Date(null)` が
 * UTC エポック（1970-01-01T00:00:00.000Z）に変換されてしまう不具合により
 * 保存されてしまったレコードを吸収するための範囲。
 * タイムゾーンの差で 1969-12-31 や 1970-01-01 09:00 などにずれるケースも
 * 拾えるように、エポックの前後1日分を許容範囲としている。
 *
 * 上限だけで判定すると 1960 年代など正当に古い日付まで「未設定」と扱われ、
 * 表示が消えるだけでなく編集時に実データを消去してしまうため、下限も設けている。
 */
const UNSET_DATE_RANGE_MS = 24 * 60 * 60 * 1000

/**
 * 日付が「未設定」とみなせるか判定する
 *
 * @remarks
 * `null` / `undefined` に加えて、UTC エポック付近（前後1日以内）の
 * 日付も「未設定」として扱う。不正な日付文字列など `Date` に変換できない
 * 値は「未設定」ではない（＝表示側で別途エラーとして扱う）ものとして `false` を返す。
 */
export const isUnsetDate = (
  date: Date | string | null | undefined
): boolean => {
  if (date === null || date === undefined) return true
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return false
  return Math.abs(d.getTime()) <= UNSET_DATE_RANGE_MS
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
