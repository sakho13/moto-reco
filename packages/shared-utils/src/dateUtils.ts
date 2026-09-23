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
 * ローカル時刻で `yyyy/mm/dd` 形式に変換する
 *
 * @remarks
 * 日付+時刻の表示（`formatDateTime`、履歴一覧のタイムスタンプなど）とは
 * 別に、単独の日付表示（購入日・所有期間の起点・グッズの購入日など）を
 * 統一する。月・日はゼロ埋めし、`formatDateTime` の日付部分と桁を揃える。
 * 台帳の「9/13」のような「日付が左に立つ」独自の表記は本関数を使わず、
 * 各コンポーネント側で個別に組んでいるため対象外。
 */
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
 * 日付が「未設定」とみなせるか判定する
 *
 * @remarks
 * `null` / `undefined` に加えて、UTC エポック（1970-01-01T00:00:00.000Z、
 * ミリ秒値でちょうど `0`）に厳密一致する日付も「未設定」として扱う。
 * `z.coerce.date()` に `null` を渡すと `new Date(null)` がこのUTCエポックに
 * 変換されてしまう不具合により保存されてしまったレコードを吸収するための判定。
 * 不正な日付文字列など `Date` に変換できない値は「未設定」ではない
 * （＝表示側で別途エラーとして扱う）ものとして `false` を返す。
 *
 * 以前はUTCエポックの前後1日を許容範囲としていたが、この範囲に実際の購入日
 * （1969-12-31〜1970-01-02）が入っていた場合、編集モーダルで日付欄が空欄に
 * なり、他の項目だけ保存すると `purchaseDate: null` が送信されて実データが
 * 消えてしまう不具合があった。購入日欄は `<input type="date">`（日付のみ）
 * 由来のため、実際の値は常にUTC 0時ちょうど（例: 1969-12-31T00:00:00.000Z）
 * になる。「時刻成分が0時ちょうどか」では誤変換されたエポックと区別できない
 * （どちらも0時ちょうどのため）が、「エポックのミリ秒値そのものと厳密一致するか」
 * であれば、隣接日（1969-12-31・1970-01-02）を巻き込まずに済む。
 * 1970-01-01 ちょうどを実際の購入日とする極端なケースのみ、依然として
 * 誤変換と区別できず「未設定」として扱われる（データ形式上避けられない
 * 既知の限界であり、他のフィールドと同様に別途登録し直せば解消する）。
 */
export const isUnsetDate = (
  date: Date | string | null | undefined
): boolean => {
  if (date === null || date === undefined) return true
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() === 0
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
