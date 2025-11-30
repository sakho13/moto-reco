import { ZodError } from 'zod'
import { ApiV1Error } from '../classes/common/ApiV1Error'

/**
 * Zodバリデーションエラーの詳細情報型
 */
export type ZodValidationErrorDetail = {
  field: string
  message: string
}

/**
 * ZodErrorをApiV1Errorに変換する
 *
 * @param error - Zodバリデーションエラー
 * @returns ApiV1Error インスタンス
 *
 * @remarks
 * バリデーションエラーの詳細はdetailsフィールドに配列形式で格納される
 *
 * @example
 * ```typescript
 * try {
 *   schema.parse(data)
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     throw convertZodErrorToApiError(error)
 *   }
 * }
 * ```
 */
export function convertZodErrorToApiError(error: ZodError): ApiV1Error {
  const details: ZodValidationErrorDetail[] = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))

  return new ApiV1Error(
    'VALIDATION_ERROR',
    'リクエストのバリデーションに失敗しました',
    details
  )
}
