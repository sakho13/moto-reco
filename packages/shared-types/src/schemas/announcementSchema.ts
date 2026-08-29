import { z } from 'zod'

/**
 * システムアナウンス作成リクエストのバリデーションスキーマ
 */
export const AdminAnnouncementCreateRequestSchema = z
  .object({
    type: z.enum(['SYSTEM_MAINTENANCE', 'RELEASE_ANNOUNCEMENT'], {
      required_error: 'タイプは必須です',
      invalid_type_error: '無効なタイプです',
    }),
    title: z
      .string({ required_error: 'タイトルは必須です' })
      .min(1, 'タイトルは1文字以上である必要があります')
      .max(100, 'タイトルは100文字以内である必要があります')
      .trim(),
    body: z
      .string({ required_error: '本文は必須です' })
      .min(1, '本文は1文字以上である必要があります')
      .max(1000, '本文は1000文字以内である必要があります')
      .trim(),
    version: z
      .string()
      .min(1, 'バージョンは1文字以上である必要があります')
      .max(20, 'バージョンは20文字以内である必要があります')
      .trim()
      .nullable()
      .optional(),
    scheduledAt: z.string().datetime().nullable().optional(),
  })
  .refine((data) => data.type !== 'RELEASE_ANNOUNCEMENT' || !!data.version, {
    message: 'リリースアナウンスにはバージョンが必須です',
    path: ['version'],
  })

export type AdminAnnouncementCreateRequest = z.infer<
  typeof AdminAnnouncementCreateRequestSchema
>
