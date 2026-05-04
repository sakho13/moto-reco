import { z } from 'zod'

export const PHOTO_MAX_COUNT = 10

export const ALLOWED_PHOTO_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type AllowedPhotoContentType =
  (typeof ALLOWED_PHOTO_CONTENT_TYPES)[number]

const UploadFileItemSchema = z.object({
  contentType: z.enum(ALLOWED_PHOTO_CONTENT_TYPES, {
    required_error: 'コンテントタイプは必須です',
    invalid_type_error: '対応していないコンテントタイプです',
  }),
  fileName: z.string({
    required_error: 'ファイル名は必須です',
    invalid_type_error: 'ファイル名は文字列で指定してください',
  }),
  fileSize: z
    .number({
      required_error: 'ファイルサイズは必須です',
      invalid_type_error: 'ファイルサイズは数値で指定してください',
    })
    .int('ファイルサイズは整数で指定してください')
    .positive('ファイルサイズは1以上で指定してください'),
})

/**
 * アップロードURL取得リクエストのバリデーションスキーマ
 * ファイルごとに contentType / fileName / fileSize を指定することで
 * 異なる形式を混在してアップロード可能
 */
export const PhotoUploadUrlRequestSchema = z.object({
  files: z
    .array(UploadFileItemSchema, {
      required_error: 'ファイル一覧は必須です',
      invalid_type_error: 'ファイル一覧は配列で指定してください',
    })
    .min(1, '1件以上のファイルを指定してください')
    .max(PHOTO_MAX_COUNT, `${PHOTO_MAX_COUNT}件以内で指定してください`),
})

export type PhotoUploadUrlRequest = z.infer<typeof PhotoUploadUrlRequestSchema>

const PhotoItemSchema = z.object({
  photoPath: z
    .string({
      required_error: '写真パスは必須です',
      invalid_type_error: '写真パスは文字列で指定してください',
    })
    .min(1, '写真パスは1文字以上で指定してください'),
  takenAt: z.coerce.date({
    required_error: '撮影日時は必須です',
    invalid_type_error: '撮影日時は日付形式で指定してください',
  }),
  memo: z
    .string({ invalid_type_error: 'メモは文字列で指定してください' })
    .max(500, 'メモは500文字以内で指定してください')
    .nullable()
    .optional(),
})

/**
 * ツーリングへの写真追加リクエストのバリデーションスキーマ
 */
export const PhotoRegisterForTouringRequestSchema = z.object({
  photos: z
    .array(PhotoItemSchema)
    .max(PHOTO_MAX_COUNT, `写真は${PHOTO_MAX_COUNT}枚以内で指定してください`),
})

export type PhotoRegisterForTouringRequest = z.infer<
  typeof PhotoRegisterForTouringRequestSchema
>

/**
 * スポットへの写真追加リクエストのバリデーションスキーマ
 */
export const PhotoRegisterForSpotRequestSchema = z.object({
  photos: z
    .array(PhotoItemSchema)
    .max(PHOTO_MAX_COUNT, `写真は${PHOTO_MAX_COUNT}枚以内で指定してください`),
})

export type PhotoRegisterForSpotRequest = z.infer<
  typeof PhotoRegisterForSpotRequestSchema
>
