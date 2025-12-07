import { zValidator } from '@hono/zod-validator'
import { ZodSchema } from 'zod'
import { convertZodErrorToApiError } from '../functions/zodErrorHandler'

/**
 * Zodスキーマを使用したリクエストボディバリデーションミドルウェアを作成
 *
 * @param schema - Zodバリデーションスキーマ
 * @returns Honoミドルウェア
 *
 * @remarks
 * バリデーションエラーが発生した場合、ApiV1Errorをスローし、
 * グローバルエラーハンドラで処理される
 *
 * @example
 * ```typescript
 * import { UserProfileUpdateRequestSchema } from '@shared-types/index'
 *
 * user.post('/profile',
 *   honoAuthMiddleware,
 *   zodValidateJson(UserProfileUpdateRequestSchema),
 *   async (c) => {
 *     const body = c.req.valid('json')
 *     // body は型安全に UserProfileUpdateRequest として扱える
 *   }
 * )
 * ```
 */
export function zodValidateJson<T extends ZodSchema>(schema: T) {
  return zValidator('json', schema, (result) => {
    if (!result.success) {
      throw convertZodErrorToApiError(result.error)
    }
  })
}

/**
 * Zodスキーマを使用したクエリパラメータバリデーションミドルウェアを作成
 *
 * @param schema - Zodバリデーションスキーマ
 * @returns Honoミドルウェア
 */
export function zodValidateQuery<T extends ZodSchema>(schema: T) {
  return zValidator('query', schema, (result) => {
    if (!result.success) {
      throw convertZodErrorToApiError(result.error)
    }
  })
}

/**
 * Zodスキーマを使用したパスパラメータバリデーションミドルウェアを作成
 *
 * @param schema - Zodバリデーションスキーマ
 * @returns Honoミドルウェア
 */
export function zodValidateParam<T extends ZodSchema>(schema: T) {
  return zValidator('param', schema, (result) => {
    if (!result.success) {
      throw convertZodErrorToApiError(result.error)
    }
  })
}
