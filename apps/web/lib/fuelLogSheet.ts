/**
 * 給油シート（登録用）のロジックをUIから切り離した純粋関数群
 *
 * @remarks
 * ライブ計器（区間距離・燃費・単価）の算出、送信用パラメータの補完、
 * 専用テンキーの数値組み立てなど、Reactに依存しない計算ロジックをまとめる。
 * サーバー側の確定値（満タン法）とは独立した「目安」の算出であり、
 * 前回給油が継ぎ足しの場合は燃費を算出しない（サーバーの確定値と一致しないため）。
 */

/** ライブ計器の算出に必要な、直近の給油履歴の最小情報 */
export type PreviousFuelLogSummary = {
  mileage: number
  isFullTank: boolean
}

/** 燃費が算出できない場合の理由 */
export type FuelEfficiencyStatus =
  | 'calculated'
  | 'continuation-selected'
  | 'no-previous-log'
  | 'previous-was-continuation'

export type LiveGaugeResult = {
  /** 区間距離 (km)。前回給油の走行距離が無い、または入力ODOが前回以下の場合は null */
  intervalKm: number | null
  /** 燃費 (km/L)。算出できない場合は null（理由は efficiencyStatus を参照） */
  fuelEfficiency: number | null
  /** 単価 (円/L)。給油量・金額のいずれかが未入力/0以下の場合は null */
  pricePerLiter: number | null
  efficiencyStatus: FuelEfficiencyStatus
}

/**
 * 入力中の値からライブ計器（区間距離・燃費・単価）を算出する
 *
 * @remarks
 * 確定値は保存後にサーバー（満タン法）が算出する。ここでの燃費算出はあくまで
 * 「打ち間違いの検算」を目的とした目安であり、直近の給油ログ1件のみを基準にする。
 * 直近の給油が継ぎ足しだった場合、サーバーは継ぎ足し分を合算して満タン法で算出するため
 * クライアント側では区間距離・単価のみ表示し、燃費は算出しない。
 */
export function calculateLiveGauges(params: {
  mileage: number | null
  amount: number | null
  totalPrice: number | null
  isFullTank: boolean
  previousLog: PreviousFuelLogSummary | null
}): LiveGaugeResult {
  const { mileage, amount, totalPrice, isFullTank, previousLog } = params

  const intervalKm =
    mileage !== null && previousLog !== null && mileage > previousLog.mileage
      ? mileage - previousLog.mileage
      : null

  const pricePerLiter =
    amount !== null && amount > 0 && totalPrice !== null && totalPrice > 0
      ? totalPrice / amount
      : null

  let efficiencyStatus: FuelEfficiencyStatus = 'calculated'
  if (!isFullTank) {
    efficiencyStatus = 'continuation-selected'
  } else if (previousLog === null) {
    efficiencyStatus = 'no-previous-log'
  } else if (!previousLog.isFullTank) {
    efficiencyStatus = 'previous-was-continuation'
  }

  const fuelEfficiency =
    efficiencyStatus === 'calculated' &&
    intervalKm !== null &&
    amount !== null &&
    amount > 0
      ? intervalKm / amount
      : null

  return { intervalKm, fuelEfficiency, pricePerLiter, efficiencyStatus }
}

/** 燃費が算出できない場合に表示する説明文 */
export const FUEL_EFFICIENCY_STATUS_MESSAGES: Record<
  Exclude<FuelEfficiencyStatus, 'calculated'>,
  string
> = {
  'continuation-selected': '燃費は次回の満タン給油で計算されます',
  'no-previous-log': '初回給油のため、燃費は次回から算出されます',
  'previous-was-continuation': '前回が継ぎ足しのため、保存後に確定します',
}

/**
 * 登録リクエストに含める previousMileage を補完する
 *
 * @remarks
 * previousMileage はAPIスキーマ上必須（`previousMileage <= mileage` の制約あり）だが、
 * 満タン法による燃費算出には使われなくなった参考値。
 * 直近の給油履歴があればその走行距離をそのまま使う（入力ミスは
 * サーバーのバリデーションエラーとしてユーザーに返す）。
 * 直近の給油履歴が無い（初回給油）場合のみ、バリデーションを必ず満たすように
 * 総走行距離と入力ODOの小さい方に丸める。
 */
export function resolveSubmitPreviousMileage(params: {
  previousLog: PreviousFuelLogSummary | null
  totalMileage: number | undefined
  mileage: number
}): number {
  const { previousLog, totalMileage, mileage } = params
  if (previousLog !== null) {
    return previousLog.mileage
  }
  if (totalMileage !== undefined) {
    return Math.min(totalMileage, mileage)
  }
  return mileage
}

/**
 * 総走行距離を更新すべきか判定する
 *
 * @remarks
 * 入力ODOが現在の総走行距離より大きい場合のみ更新する（後退は無視）。
 */
export function shouldUpdateTotalMileage(
  mileage: number,
  totalMileage: number | undefined
): boolean {
  if (totalMileage === undefined) return false
  return mileage > totalMileage
}

/** 文字列を数値としてパースする。空文字・不正な値は null */
export function parseFieldNumber(raw: string): number | null {
  if (raw.trim() === '' || raw === '.' || raw === '-') return null
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

/** 整数値を桁区切り表示に変換する。空文字はそのまま空文字を返す */
export function formatIntegerDisplay(raw: string): string {
  if (raw.trim() === '') return ''
  const num = Number(raw)
  if (!Number.isFinite(num)) return raw
  return num.toLocaleString('ja-JP')
}

export type NumericFieldConstraints = {
  /** 小数点を許可するか */
  allowDecimal: boolean
  /** 整数部の最大桁数 */
  maxIntegerDigits: number
  /** 小数部の最大桁数（allowDecimalがfalseの場合は無視） */
  maxDecimalDigits: number
}

/**
 * 専用テンキー（および物理キーボードの数字入力）1打鍵分を、現在の文字列に反映する
 *
 * @remarks
 * OSキーボードを介さずに桁を組み立てるための純粋関数。
 * `key` は `'0'`〜`'9'` / `'.'` / `'backspace'` のいずれか。それ以外は無視する。
 */
export function appendNumericKey(
  current: string,
  key: string,
  constraints: NumericFieldConstraints
): string {
  const { allowDecimal, maxIntegerDigits, maxDecimalDigits } = constraints

  if (key === 'backspace') {
    return current.slice(0, -1)
  }

  if (key === '.') {
    if (!allowDecimal || current.includes('.')) return current
    return current === '' ? '0.' : `${current}.`
  }

  if (!/^[0-9]$/.test(key)) return current

  const dotIndex = current.indexOf('.')
  if (dotIndex === -1) {
    if (current.length >= maxIntegerDigits) return current
    if (current === '0') return key
    return current + key
  }

  const decimalDigits = current.length - dotIndex - 1
  if (decimalDigits >= maxDecimalDigits) return current
  return current + key
}

/** 通常の（OSキーボードからの）テキスト入力を、フィールドの制約に合わせて整形する */
export function sanitizeNumericInput(
  value: string,
  constraints: Pick<
    NumericFieldConstraints,
    'allowDecimal' | 'maxDecimalDigits'
  >
): string {
  const { allowDecimal, maxDecimalDigits } = constraints
  let sanitized = value.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '')

  if (allowDecimal) {
    const firstDot = sanitized.indexOf('.')
    if (firstDot !== -1) {
      const intPart = sanitized.slice(0, firstDot)
      const decPart = sanitized
        .slice(firstDot + 1)
        .replace(/\./g, '')
        .slice(0, maxDecimalDigits)
      sanitized = `${intPart}.${decPart}`
    }
  }

  return sanitized
}

/**
 * 給油日時チップの表示ラベルを生成する（例: 「今日 14:15」「9/13 14:15」）
 */
export function formatRefueledAtChipLabel(
  value: string,
  now: Date = new Date()
): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) return `今日 ${hh}:${mm}`
  return `${date.getMonth() + 1}/${date.getDate()} ${hh}:${mm}`
}
