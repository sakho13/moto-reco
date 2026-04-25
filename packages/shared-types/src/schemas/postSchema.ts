import { z } from 'zod'

export const POST_PHOTO_MAX_COUNT = 10

/**
 * 投稿登録リクエストのバリデーションスキーマ
 */
export const PostRegisterRequestSchema = z.object({
  title: z
    .string({
      invalid_type_error: 'タイトルは文字列で指定してください',
    })
    .max(100, 'タイトルは100文字以内で指定してください')
    .nullable()
    .optional(),
  description: z
    .string({
      invalid_type_error: '説明は文字列で指定してください',
    })
    .max(1000, '説明は1000文字以内で指定してください')
    .nullable()
    .optional(),
  occurredAt: z.coerce.date({
    required_error: '投稿日時は必須です',
    invalid_type_error: '投稿日時は日付形式で指定してください',
  }),
  photoUrls: z
    .array(
      z
        .string({ invalid_type_error: '写真URLは文字列で指定してください' })
        .url('写真URLは有効なURL形式で指定してください')
    )
    .max(
      POST_PHOTO_MAX_COUNT,
      `写真は${POST_PHOTO_MAX_COUNT}枚以内で指定してください`
    )
    .default([]),
})

export type PostRegisterRequest = z.infer<typeof PostRegisterRequestSchema>

/**
 * 投稿削除リクエストのバリデーションスキーマ
 */
export const PostDeleteRequestSchema = z.object({
  postId: z
    .string({
      required_error: '投稿IDは必須です',
      invalid_type_error: '投稿IDは文字列で指定してください',
    })
    .min(1, '投稿IDは1文字以上で指定してください'),
})

export type PostDeleteRequest = z.infer<typeof PostDeleteRequestSchema>

/**
 * 投稿一覧取得クエリパラメータのバリデーションスキーマ
 */
export const PostListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  'per-size': z.coerce.number().int().min(1).max(100).default(20).optional(),
})

export type PostListQuery = z.infer<typeof PostListQuerySchema>
