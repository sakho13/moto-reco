import {
  parseFieldNumber,
  resolveSubmitPreviousMileage,
  sanitizeNumericInput,
  shouldUpdateTotalMileage,
  type NumericFieldConstraints,
  type ResolvedPreviousFuelLog,
} from '@repo/shared-domain/fuelLogSheet'
import type {
  ApiResponseFuelLogDetail,
  FuelLogRegisterRequest,
  FuelLogUpdateRequest,
} from '@repo/shared-types'

/** 数値を入力する項目 */
export type FuelLogNumericField = 'mileage' | 'amount' | 'totalPrice'

/** 給油の記録フォームの入力値（数値は入力途中の文字列のまま持つ） */
export type FuelLogFormValues = {
  refueledAt: Date
  mileage: string
  amount: string
  totalPrice: string
  isFullTank: boolean
  memo: string
}

/** 入力チェックの結果（項目ごとのエラー文言） */
export type FuelLogFormErrors = Partial<
  Record<FuelLogNumericField | 'memo', string>
>

/** 入力チェックを通った値 */
export type ParsedFuelLogForm = {
  refueledAt: Date
  mileage: number
  amount: number
  totalPrice: number
  isFullTank: boolean
  memo: string | null
}

/** メモの最大文字数（API の制約と同じ） */
export const FUEL_LOG_MEMO_MAX_LENGTH = 500

/**
 * 数値項目の桁数の制約
 *
 * @remarks
 * Web の給油記入票（`FuelLogRegisterSheet`）と同じ値にしている。
 */
export const FUEL_LOG_FIELD_CONSTRAINTS: Record<
  FuelLogNumericField,
  NumericFieldConstraints
> = {
  mileage: { allowDecimal: false, maxIntegerDigits: 7, maxDecimalDigits: 0 },
  amount: { allowDecimal: true, maxIntegerDigits: 3, maxDecimalDigits: 2 },
  totalPrice: {
    allowDecimal: false,
    maxIntegerDigits: 7,
    maxDecimalDigits: 0,
  },
}

/**
 * キーボードから入力された文字を、項目の制約に合わせて整える
 *
 * @remarks
 * 数字（と給油量の小数点）以外を取り除き、整数部の桁数を制限する。
 */
export function sanitizeFuelLogNumericInput(
  field: FuelLogNumericField,
  value: string
): string {
  const constraints = FUEL_LOG_FIELD_CONSTRAINTS[field]
  const sanitized = sanitizeNumericInput(value, constraints)
  const [integerPart = '', ...rest] = sanitized.split('.')
  const limitedInteger = integerPart.slice(0, constraints.maxIntegerDigits)
  return rest.length > 0 ? `${limitedInteger}.${rest.join('')}` : limitedInteger
}

/** 新規登録フォームの初期値 */
export function createEmptyFuelLogForm(
  now: Date = new Date()
): FuelLogFormValues {
  return {
    refueledAt: now,
    mileage: '',
    amount: '',
    totalPrice: '',
    isFullTank: true,
    memo: '',
  }
}

/** 保存済みの給油記録を、編集フォームの初期値にする */
export function toFuelLogFormValues(
  detail: Pick<
    ApiResponseFuelLogDetail,
    'refueledAt' | 'mileage' | 'amount' | 'totalPrice' | 'isFullTank' | 'memo'
  >
): FuelLogFormValues {
  return {
    refueledAt: new Date(detail.refueledAt),
    mileage: String(detail.mileage),
    amount: String(detail.amount),
    totalPrice: String(detail.totalPrice),
    isFullTank: detail.isFullTank,
    memo: detail.memo ?? '',
  }
}

/**
 * フォームの入力をチェックする
 *
 * @returns エラーがあれば `errors`、無ければ数値に変換した `parsed`
 */
export function validateFuelLogForm(
  values: FuelLogFormValues
):
  | { ok: true; parsed: ParsedFuelLogForm }
  | { ok: false; errors: FuelLogFormErrors } {
  const errors: FuelLogFormErrors = {}
  const mileage = parseFieldNumber(values.mileage)
  const amount = parseFieldNumber(values.amount)
  const totalPrice = parseFieldNumber(values.totalPrice)
  const memo = values.memo.trim()

  if (mileage === null) {
    errors.mileage = '走行距離（ODO）を入力してください'
  }
  if (amount === null) {
    errors.amount = '給油量を入力してください'
  } else if (amount <= 0) {
    errors.amount = '給油量は0より大きい値を入力してください'
  }
  if (totalPrice === null) {
    errors.totalPrice = '支払金額を入力してください'
  }
  if (memo.length > FUEL_LOG_MEMO_MAX_LENGTH) {
    errors.memo = `メモは${FUEL_LOG_MEMO_MAX_LENGTH}文字以内で入力してください`
  }

  if (
    mileage === null ||
    amount === null ||
    totalPrice === null ||
    Object.keys(errors).length > 0
  ) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    parsed: {
      refueledAt: values.refueledAt,
      mileage,
      amount,
      totalPrice,
      isFullTank: values.isFullTank,
      memo: memo.length > 0 ? memo : null,
    },
  }
}

/**
 * 給油の登録リクエストを組み立てる
 *
 * @remarks
 * Web の給油記入票と同じく、前回走行距離は「選んだ給油日時以前で最も新しい
 * 給油記録」の走行距離にする（`resolveSubmitPreviousMileage`）。入力した ODO が
 * 愛車の総走行距離より大きければ、総走行距離も更新する。
 *
 * @param resolvedPreviousLog - 選んだ給油日時以前で最も新しい給油記録。無ければ null
 * @param totalMileage - 愛車の現在の総走行距離
 */
export function buildFuelLogRegisterRequest(params: {
  parsed: ParsedFuelLogForm
  resolvedPreviousLog: ResolvedPreviousFuelLog | null
  totalMileage: number | undefined
}): FuelLogRegisterRequest {
  const { parsed, resolvedPreviousLog, totalMileage } = params
  return {
    refueledAt: parsed.refueledAt,
    mileage: parsed.mileage,
    previousMileage: resolveSubmitPreviousMileage({
      mileage: parsed.mileage,
      resolvedPreviousLog,
      totalMileage,
    }),
    amount: parsed.amount,
    totalPrice: parsed.totalPrice,
    isFullTank: parsed.isFullTank,
    memo: parsed.memo,
    updateTotalMileage: shouldUpdateTotalMileage(parsed.mileage, totalMileage),
  }
}

/**
 * 給油の更新リクエストを組み立てる
 *
 * @remarks
 * 前回走行距離は保存済みの値をそのまま送る（Web の編集画面と同じ）。
 */
export function buildFuelLogUpdateRequest(params: {
  fuelLogId: string
  parsed: ParsedFuelLogForm
  previousMileage: number
}): FuelLogUpdateRequest {
  const { fuelLogId, parsed, previousMileage } = params
  return {
    fuelLogId,
    refueledAt: parsed.refueledAt,
    mileage: parsed.mileage,
    previousMileage,
    amount: parsed.amount,
    totalPrice: parsed.totalPrice,
    isFullTank: parsed.isFullTank,
    memo: parsed.memo,
  }
}
