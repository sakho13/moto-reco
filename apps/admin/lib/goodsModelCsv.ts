import { z } from 'zod'
import { GOODS_CATEGORY_OPTIONS } from '@/lib/goodsCategory'

/** UTF-8のBOM（Excelで文字化けさせないためにテンプレートへ付与する） */
export const UTF8_BOM = '\uFEFF'

/** CSV取り込みで1回に受け付ける最大データ行数 */
export const GOODS_MODEL_CSV_MAX_ROWS = 1000

/** CSV取り込みで受け付ける最大ファイルサイズ（バイト） */
export const GOODS_MODEL_CSV_MAX_BYTES = 1024 * 1024

/** 必須列 */
export const GOODS_MODEL_CSV_REQUIRED_COLUMNS = [
  'manufacturerName',
  'modelNumber',
  'name',
  'category',
] as const

/** 任意列 */
export const GOODS_MODEL_CSV_OPTIONAL_COLUMNS = [
  'imageUrl',
  'description',
  'releaseDate',
  'amazonAsin',
  'rakutenItemId',
  'officialUrl',
  'isActive',
] as const

export const GOODS_MODEL_CSV_COLUMNS = [
  ...GOODS_MODEL_CSV_REQUIRED_COLUMNS,
  ...GOODS_MODEL_CSV_OPTIONAL_COLUMNS,
] as const

export type GoodsModelCsvColumn = (typeof GOODS_MODEL_CSV_COLUMNS)[number]

export type GoodsCategoryValue =
  (typeof GOODS_CATEGORY_OPTIONS)[number]['value']

/**
 * カテゴリ文字列（enum値 or 日本語ラベル）をenum値に変換する
 *
 * @returns 該当するカテゴリがない場合は null
 */
export function resolveGoodsCategory(input: string): GoodsCategoryValue | null {
  const normalized = input.trim()
  const option = GOODS_CATEGORY_OPTIONS.find(
    (o) => o.value === normalized.toUpperCase() || o.label === normalized
  )
  return option?.value ?? null
}

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

const requiredString = (label: string) =>
  z
    .string({ required_error: `${label}は必須です` })
    .trim()
    .min(1, `${label}は必須です`)

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().trim().optional()
)

/**
 * http(s) のURLかどうかを判定する
 */
const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const optionalUrl = (label: string) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .refine(isHttpUrl, `${label}はhttp(s)のURL形式で入力してください`)
      .optional()
  )

const TRUE_VALUES = ['true', '1']
const FALSE_VALUES = ['false', '0']

/**
 * グッズ型番CSVの1行分のバリデーションスキーマ
 */
export const GoodsModelCsvRowSchema = z.object({
  manufacturerName: requiredString('メーカー名'),
  modelNumber: requiredString('型番'),
  name: requiredString('商品名'),
  category: requiredString('カテゴリ').transform((value, ctx) => {
    const category = resolveGoodsCategory(value)
    if (!category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `カテゴリ「${value}」は存在しません`,
      })
      return z.NEVER
    }
    return category
  }),
  imageUrl: optionalUrl('商品画像URL'),
  description: optionalString,
  releaseDate: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        '販売開始日はYYYY-MM-DD形式で入力してください'
      )
      .transform((value, ctx) => {
        const date = new Date(`${value}T00:00:00Z`)
        if (
          Number.isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !== value
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `販売開始日「${value}」は存在しない日付です`,
          })
          return z.NEVER
        }
        return date
      })
      .optional()
  ),
  amazonAsin: optionalString,
  rakutenItemId: optionalString,
  officialUrl: optionalUrl('公式サイトURL'),
  isActive: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .transform((value, ctx) => {
        const lower = value.toLowerCase()
        if (TRUE_VALUES.includes(lower)) return true
        if (FALSE_VALUES.includes(lower)) return false
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            '有効フラグは true / false / 1 / 0 のいずれかで入力してください',
        })
        return z.NEVER
      })
      .default('true')
  ),
})

export type GoodsModelCsvRow = z.infer<typeof GoodsModelCsvRowSchema>

/**
 * CSV取り込みテンプレート（BOM付きUTF-8）の内容を生成する
 */
export function buildGoodsModelCsvTemplate(): string {
  const header = GOODS_MODEL_CSV_COLUMNS.join(',')
  const sample = [
    'サンプルメーカー',
    'ABC-123',
    'サンプルヘルメット',
    'HELMET',
    'https://example.com/images/abc-123.jpg',
    '"紹介文（改行やカンマを含む場合は\nダブルクォートで囲む）"',
    '2026-01-01',
    'B00XXXXXXXX',
    '',
    'https://example.com/products/abc-123',
    'true',
  ].join(',')
  return `${UTF8_BOM}${header}\r\n${sample}\r\n`
}
