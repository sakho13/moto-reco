import { z } from 'zod'

/**
 * ユーザー購入グッズ登録リクエストのバリデーションスキーマ
 */
export const UserGoodsRegisterRequestSchema = z.object({
  goodsModelId: z
    .string({
      required_error: '型番IDは必須です',
      invalid_type_error: '型番IDは文字列で指定してください',
    })
    .min(1, '型番IDは1文字以上で指定してください'),
  userMyBikeId: z
    .string({
      invalid_type_error: 'マイバイクIDは文字列で指定してください',
    })
    .min(1, 'マイバイクIDは1文字以上で指定してください')
    .nullable()
    .optional(),
  purchasedAt: z.coerce
    .date({
      invalid_type_error: '購入日は日付形式で指定してください',
    })
    .nullable()
    .optional(),
  price: z
    .number({
      invalid_type_error: '価格は数値で指定してください',
    })
    .int('価格は整数で指定してください')
    .nonnegative('価格は0以上で指定してください')
    .nullable()
    .optional(),
  memo: z
    .string({
      invalid_type_error: 'メモは文字列で指定してください',
    })
    .max(500, 'メモは500文字以内で指定してください')
    .nullable()
    .optional(),
})

export type UserGoodsRegisterRequest = z.infer<
  typeof UserGoodsRegisterRequestSchema
>

/**
 * ユーザー購入グッズ一覧取得クエリパラメータのバリデーションスキーマ
 */
export const UserGoodsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  'per-size': z.coerce.number().int().min(1).max(100).default(20).optional(),
  myUserBikeId: z
    .string({
      invalid_type_error: 'マイバイクIDは文字列で指定してください',
    })
    .min(1, 'マイバイクIDは1文字以上で指定してください')
    .optional(),
})

export type UserGoodsListQuery = z.infer<typeof UserGoodsListQuerySchema>

/**
 * ユーザー購入グッズ詳細取得パスパラメータのバリデーションスキーマ
 *
 * @remarks
 * `GET/PATCH/DELETE /api/v1/user-goods/:userGoodsId` で共通利用する
 */
export const UserGoodsDetailParamSchema = z.object({
  userGoodsId: z
    .string({
      required_error: '購入グッズIDは必須です',
      invalid_type_error: '購入グッズIDは文字列で指定してください',
    })
    .min(1, '購入グッズIDは1文字以上で指定してください'),
})

export type UserGoodsDetailParam = z.infer<typeof UserGoodsDetailParamSchema>

/**
 * ユーザー購入グッズ更新リクエストのバリデーションスキーマ
 *
 * @remarks
 * 更新対象IDはパスパラメータ（`UserGoodsDetailParamSchema`）から取得するため含まない
 */
export const UserGoodsUpdateRequestSchema = z
  .object({
    goodsModelId: z
      .string({
        invalid_type_error: '型番IDは文字列で指定してください',
      })
      .min(1, '型番IDは1文字以上で指定してください')
      .optional(),
    userMyBikeId: z
      .string({
        invalid_type_error: 'マイバイクIDは文字列で指定してください',
      })
      .min(1, 'マイバイクIDは1文字以上で指定してください')
      .nullable()
      .optional(),
    purchasedAt: z.coerce
      .date({
        invalid_type_error: '購入日は日付形式で指定してください',
      })
      .nullable()
      .optional(),
    price: z
      .number({
        invalid_type_error: '価格は数値で指定してください',
      })
      .int('価格は整数で指定してください')
      .nonnegative('価格は0以上で指定してください')
      .nullable()
      .optional(),
    memo: z
      .string({
        invalid_type_error: 'メモは文字列で指定してください',
      })
      .max(500, 'メモは500文字以内で指定してください')
      .nullable()
      .optional(),
  })
  .refine(
    (data) =>
      data.goodsModelId !== undefined ||
      data.userMyBikeId !== undefined ||
      data.purchasedAt !== undefined ||
      data.price !== undefined ||
      data.memo !== undefined,
    {
      message: 'いずれかの更新項目を指定してください',
    }
  )

export type UserGoodsUpdateRequest = z.infer<
  typeof UserGoodsUpdateRequestSchema
>
