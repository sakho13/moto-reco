/**
 * 給油シート（登録用）のロジックをUIから切り離した純粋関数群
 *
 * @remarks
 * ライブ計器（区間距離・燃費・単価）の算出、送信用パラメータの補完、
 * 専用テンキーの数値組み立てなど、Reactに依存しない計算ロジックをまとめる。
 * サーバー側の確定値（満タン法）とは独立した「目安」の算出であり、
 * 前回給油が継ぎ足しの場合は燃費を算出しない（サーバーの確定値と一致しないため）。
 */

import { FuelEfficiencyCalculationService } from '@repo/shared-domain'

const fuelEfficiencyCalculationService = new FuelEfficiencyCalculationService()

/** {@link calculateBridgedAverageEfficiency} の対象1件の最小情報 */
export type BridgedAverageEfficiencyTarget = {
  fuelLogId: string
  mileage: number
  amount: number
  isFullTank: boolean
}

/**
 * 期間フィルタの境界をまたぐ区間も正しく満タン法で算出できるようにした、
 * 距離加重平均の燃費 (km/L)
 *
 * @remarks
 * 愛車カルテの「平均燃費」（`BikeStatsSection`）は、期間フィルタで絞った
 * 給油履歴だけを満タン法（{@link FuelEfficiencyCalculationService}）に渡すと、
 * 期間の先頭にある給油が実際には期間より前の満タン給油から続く区間だった
 * 場合に、直前の満タン給油を参照できず「初回給油」相当として区間が誤って
 * 除外されてしまう（Issue #575 Codexの指摘#5）。
 *
 * サーバー側の `PrismaFuelInsightRepository.findBridgeRows`（境界より前の
 * 記録を取得し、区間判定にのみ使う仕組み）と同じ考え方をクライアント側にも
 * 適用する。区間判定（直前の満タン給油の参照）は期間フィルタ前の給油履歴
 * 全件（`allLogs`）で行い、平均の母数（分母・分子）は期間フィルタ済みの
 * 給油ログ（`inPeriodFuelLogIds` に含まれるもの）のみに限定する。
 *
 * @param allLogs 期間フィルタ前の給油履歴全件（順不同で可）
 * @param inPeriodFuelLogIds 平均の母数に含める給油ログID（期間フィルタ後）の集合
 * @returns 距離加重平均の燃費 (km/L)。算出できる区間が無ければ null
 */
export function calculateBridgedAverageEfficiency(
  allLogs: readonly BridgedAverageEfficiencyTarget[],
  inPeriodFuelLogIds: ReadonlySet<string>
): number | null {
  const orderedByMileageAsc = [...allLogs].sort((a, b) => a.mileage - b.mileage)
  const details =
    fuelEfficiencyCalculationService.calculateDetails(orderedByMileageAsc)

  let totalDistance = 0
  let totalAmount = 0
  for (const [fuelLogId, interval] of details) {
    if (interval === null || !inPeriodFuelLogIds.has(fuelLogId)) continue
    totalDistance += interval.distance
    totalAmount += interval.amount
  }

  return totalAmount > 0 ? totalDistance / totalAmount : null
}

/** ライブ計器の算出に必要な、直近の給油履歴の最小情報 */
export type PreviousFuelLogSummary = {
  mileage: number
  isFullTank: boolean
}

/**
 * PC版「給油記入票」の控え欄（前回の給油の再掲）に必要な、直近の給油履歴の情報
 *
 * @remarks
 * `PreviousFuelLogSummary` のスーパーセット。ライブ計器の算出（`calculateLiveGauges`）には
 * 使わない表示専用フィールド（給油日時・給油量・金額・サーバー確定済みの燃費/単価）を追加する。
 */
export type PreviousFuelLogDetail = PreviousFuelLogSummary & {
  refueledAt: string
  amount: number
  totalPrice: number
  /** サーバー確定済みの燃費 (km/L)。継ぎ足し等で算出できなかった場合は null */
  fuelEfficiency: number | null
  /** サーバー確定済みの単価 (円/L) */
  pricePerLiter: number | null
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

/** 保存済みの満タン給油ログで燃費が算出できない理由 */
export type SavedFuelLogEfficiencyReason =
  | 'no-previous-log'
  | 'previous-was-continuation'

/** 保存済みログ一覧で理由を判定する際に必要な最小情報 */
export type SavedFuelLogReferenceEntry = {
  fuelLogId: string
  mileage: number
  isFullTank: boolean
}

/**
 * 保存済みの満タン給油（`isFullTank: true` かつ `fuelEfficiency: null`）について、
 * 燃費が算出できない理由を「初回給油」と「前回が継ぎ足し」に区別する
 *
 * @remarks
 * `FuelEfficiencyCalculationService` は「直前の満タン給油が無い」を単一の
 * null 理由として扱うため、そのままでは「そもそも前の記録が無い（本当の初回給油）」
 * と「前の記録はあるが継ぎ足しだった」を画面側で区別できず、後者にも
 * 「初回給油」という誤ったラベルが付いてしまう。
 * 同一バイクの給油履歴をmileage昇順に並べたとき、対象の直前のログの有無・
 * 区分だけで区別できるため、ここで判定する。
 *
 * `logs` に対象より前のログが含まれない場合（期間フィルタ・ページング・
 * 直近N件抜粋などで対象外になっている場合を含む）は、区別する材料が無いため
 * `'no-previous-log'` 側にフォールバックする。
 */
export function resolveSavedFuelLogEfficiencyReason(
  logsOrderedByMileageAsc: readonly SavedFuelLogReferenceEntry[],
  targetFuelLogId: string
): SavedFuelLogEfficiencyReason {
  const index = logsOrderedByMileageAsc.findIndex(
    (log) => log.fuelLogId === targetFuelLogId
  )
  const previous = index > 0 ? logsOrderedByMileageAsc[index - 1] : null
  return previous && !previous.isFullTank
    ? 'previous-was-continuation'
    : 'no-previous-log'
}

/** {@link resolveSavedFuelLogEfficiencyReason} の判定結果を短い表示文言にする */
export const SAVED_FUEL_LOG_EFFICIENCY_REASON_LABELS: Record<
  SavedFuelLogEfficiencyReason,
  string
> = {
  'no-previous-log': '初回給油',
  'previous-was-continuation': '前回が継ぎ足し',
}

/**
 * 直近の給油ログ群から平均燃費を算出する（PC版「給油記入票」控え欄の「平均より」比較に使用）
 *
 * @remarks
 * 継ぎ足し給油など燃費を算出できなかったログ（`fuelEfficiency === null`）は平均の対象から除く。
 * 対象が1件も無い場合は null を返す。
 */
export function calculateAverageFuelEfficiency(
  logs: readonly { fuelEfficiency: number | null }[]
): number | null {
  const values = logs
    .map((log) => log.fuelEfficiency)
    .filter((v): v is number => v !== null)
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/** 今回の燃費と「前回」「平均」との差分 (km/L)。算出できない場合は null */
export type FuelEfficiencyComparison = {
  previousDiff: number | null
  averageDiff: number | null
}

/**
 * km/L の値を画面表示と同じ小数点1桁に丸める
 *
 * @remarks
 * 燃費の差分表示（本ファイルの `formatComparisonClause` ・
 * `components/home/HomeGauges.tsx` の `buildEfficiencyDiffText`）は、
 * 丸め前の生値どうしの差ではなく、この関数で丸めた値どうしの差を取る。
 * 例えば22.0339…（表示22.0）と20.1613…（表示20.2）の差は、生値では
 * 1.8726（丸めると1.9）だが、ユーザーには22.0と20.2しか見えないため
 * 表示と文章を一致させるには丸めた値どうしで引く必要がある（差は1.8）。
 */
export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

/**
 * 今回のライブ計器の燃費を、前回給油・直近の平均燃費と比較する
 *
 * @remarks
 * 今回の燃費が算出できていない（`currentFuelEfficiency === null`）場合は両方 null を返す。
 * 差分は表示値と同じ丸め後の値どうしで取る（{@link roundToOneDecimal} 参照）。
 */
export function calculateFuelEfficiencyComparison(params: {
  currentFuelEfficiency: number | null
  previousFuelEfficiency: number | null
  averageFuelEfficiency: number | null
}): FuelEfficiencyComparison {
  const {
    currentFuelEfficiency,
    previousFuelEfficiency,
    averageFuelEfficiency,
  } = params
  if (currentFuelEfficiency === null) {
    return { previousDiff: null, averageDiff: null }
  }
  const roundedCurrent = roundToOneDecimal(currentFuelEfficiency)
  return {
    previousDiff:
      previousFuelEfficiency !== null
        ? roundedCurrent - roundToOneDecimal(previousFuelEfficiency)
        : null,
    averageDiff:
      averageFuelEfficiency !== null
        ? roundedCurrent - roundToOneDecimal(averageFuelEfficiency)
        : null,
  }
}

/**
 * 燃費の比較結果を「前回より 1.8 伸びた ／ 直近6回の平均より 0.8 伸びた」のような文言に整形する
 *
 * @remarks
 * 前回比・平均比のいずれか片方しか無い場合はその1文だけを返す。両方無ければ null。
 * 差が ±0.05 km/L 未満は「同じ」として扱う。
 * 平均の母数（`recentAverageCount`。呼び出し元は `FuelLogRegisterModal` の
 * `RECENT_FUEL_LOG_COUNT`）は、愛車画面の「平均燃費」（期間フィルタ全体が母数）とは
 * 異なる。単に「平均」とだけ表示すると数値の食い違いに見えるため、母数を明示する。
 */
export function formatFuelEfficiencyComparisonNote(
  comparison: FuelEfficiencyComparison,
  recentAverageCount: number
): string | null {
  const clauses: string[] = []
  if (comparison.previousDiff !== null) {
    clauses.push(formatComparisonClause('前回', comparison.previousDiff))
  }
  if (comparison.averageDiff !== null) {
    clauses.push(
      formatComparisonClause(
        `直近${recentAverageCount}回の平均`,
        comparison.averageDiff
      )
    )
  }
  return clauses.length > 0 ? clauses.join(' ／ ') : null
}

function formatComparisonClause(label: string, diff: number): string {
  const abs = Math.abs(diff)
  if (abs < 0.05) return `${label}と同じ`
  const verb = diff > 0 ? '伸びた' : '縮んだ'
  return `${label}より ${abs.toFixed(1)} ${verb}`
}

/**
 * 基準日から見て、対象の日時が何日前かを算出する（時刻は無視し、日付のみで比較する）
 *
 * @returns 日数（0以上の整数）。不正な日時の場合は null
 */
export function calculateDaysAgo(
  target: string,
  now: Date = new Date()
): number | null {
  const date = new Date(target)
  if (Number.isNaN(date.getTime())) return null
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffMs = startOfDay(now) - startOfDay(date)
  return Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)))
}

/**
 * PC版「給油記入票」控え欄の見出し（例: 「前回の控え ─ 9月1日（12日前）」）を組み立てる
 */
export function formatPreviousStubHeading(
  refueledAt: string,
  now: Date = new Date()
): string {
  const date = new Date(refueledAt)
  if (Number.isNaN(date.getTime())) return '前回の控え'
  const dateLabel = `${date.getMonth() + 1}月${date.getDate()}日`
  const daysAgo = calculateDaysAgo(refueledAt, now)
  if (daysAgo === null) return `前回の控え ─ ${dateLabel}`
  if (daysAgo === 0) return `前回の控え ─ ${dateLabel}（今日）`
  return `前回の控え ─ ${dateLabel}（${daysAgo}日前）`
}

/** `resolveSubmitPreviousMileage` が基準ログ探索に使う、給油履歴の最小情報 */
export type FuelLogReferenceEntry = {
  mileage: number
  refueledAt: string
}

/**
 * 登録リクエストに含める previousMileage を補完する
 *
 * @remarks
 * previousMileage はAPIスキーマ上必須（`previousMileage <= mileage` の制約あり）だが、
 * 満タン法による燃費算出には使われなくなった参考値。ただし台帳・履歴の「区間距離」
 * 表示（`mileage - previousMileage`）には使われるため、値そのものの妥当性は保ちたい。
 *
 * 日時チップから過去の給油を選んで入力した場合、常に「直近の給油ログ」（最新のもの）
 * を基準にすると、その走行距離が今回の入力ODOを上回り
 * `previousMileage <= mileage` のバリデーションに必ず違反する回帰があったため、
 * `logs` の中から選択した給油日時（`refueledAt`）以前で最も新しいログを基準にする。
 * 該当するログが無い（選択した日時がどの既存ログよりも古い＝実質的な初回給油）
 * 場合のみ、バリデーションを満たすように総走行距離と入力ODOの小さい方に丸める。
 */
export function resolveSubmitPreviousMileage(params: {
  refueledAt: string
  mileage: number
  logs: readonly FuelLogReferenceEntry[]
  totalMileage: number | undefined
}): number {
  const { refueledAt, mileage, logs, totalMileage } = params
  const targetTime = new Date(refueledAt).getTime()

  let closest: FuelLogReferenceEntry | null = null
  for (const log of logs) {
    const logTime = new Date(log.refueledAt).getTime()
    if (logTime > targetTime) continue
    if (closest === null || logTime > new Date(closest.refueledAt).getTime()) {
      closest = log
    }
  }

  if (closest !== null) {
    // 入力ミスによる前回以下のmileageもそのまま返す（サーバー側のバリデーション
    // エラーとしてユーザーに返す。ここで無言に補正すると入力ミスに気づけない）
    return closest.mileage
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
