import type { ProviderType } from '@repo/shared-types'
import { toast } from '@repo/ui/sonner'
import { unlinkProvidersExcept, type SwitchableProviderId } from './auth'
import { apiPut } from '@/lib/api/client'

/** ログインに使える認証方式 */
export type LoginProviderType = Extract<
  ProviderType,
  'FIREBASE_EMAIL' | 'FIREBASE_GOOGLE'
>

/** ログインに使った認証方式に対応する Firebase の認証方式ID */
const LOGIN_PROVIDER_ID: Record<LoginProviderType, SwitchableProviderId> = {
  FIREBASE_EMAIL: 'password',
  FIREBASE_GOOGLE: 'google.com',
}

/** ログインに使った認証方式の表示名 */
const LOGIN_PROVIDER_LABEL: Record<LoginProviderType, string> = {
  FIREBASE_EMAIL: 'メール/パスワード',
  FIREBASE_GOOGLE: 'Google',
}

/**
 * ログインに使った認証方式へサーバー側の認証方式を切り替える
 *
 * @remarks
 * 失敗してもログイン処理は継続する。
 */
export const syncLoginProvider = async (
  providerType: LoginProviderType
): Promise<void> => {
  try {
    await unlinkProvidersExcept(LOGIN_PROVIDER_ID[providerType])
    const response = await apiPut('/api/v1/user/auth/provider', {
      providerType,
    })
    if (response.data.switched) {
      toast.success(
        `ログイン方法を${LOGIN_PROVIDER_LABEL[providerType]}に切り替えました`
      )
    }
  } catch (error: unknown) {
    console.error('Login provider sync error:', error)
  }
}
