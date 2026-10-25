import { z } from 'zod'
import { ProviderTypeMap } from '../domain/authprovider'

/**
 * 認証方式切り替えリクエストのバリデーションスキーマ
 *
 * @remarks
 * - providerType: 切り替え先の認証方式（FIREBASE_EMAIL / FIREBASE_GOOGLE）
 */
export const UserAuthProviderSwitchRequestSchema = z.object({
  providerType: z.enum(
    [ProviderTypeMap.FIREBASE_EMAIL, ProviderTypeMap.FIREBASE_GOOGLE],
    {
      required_error: '切り替え先の認証方式は必須です',
      invalid_type_error: '切り替え先の認証方式が不正です',
    }
  ),
})

/**
 * 認証方式切り替えリクエストの型
 */
export type UserAuthProviderSwitchRequest = z.infer<
  typeof UserAuthProviderSwitchRequestSchema
>
