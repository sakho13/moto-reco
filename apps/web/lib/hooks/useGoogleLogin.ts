'use client'

import { useRouter } from 'next/navigation'
import { ApiV1Error } from '@repo/shared-domain'
import { useAuth } from './useAuth'
import { trackEvent } from '@/lib/analytics'
import { apiGet, apiPost } from '@/lib/api/client'
import { getFirebaseErrorMessage } from '@/lib/constants/errorMessages'
import { getFirebaseAuth } from '@/lib/firebase/config'
import { syncLoginProvider } from '@/lib/firebase/syncLoginProvider'

/** ユーザー操作によるキャンセルを示すFirebaseエラーコード */
const GOOGLE_LOGIN_CANCEL_ERROR_CODES: readonly string[] = [
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
]

/** 専用の案内メッセージを表示するFirebaseエラーコード */
const GOOGLE_LOGIN_GUIDED_ERROR_CODES: readonly string[] = [
  'auth/popup-blocked',
  'auth/account-exists-with-different-credential',
]

/**
 * Googleログイン（未登録ユーザーの自動登録を含む）を行うカスタムフック
 */
export const useGoogleLogin = () => {
  const router = useRouter()
  const { signInWithGoogle, signOut } = useAuth()

  /**
   * Googleログイン処理
   *
   * フロー:
   * 1. Google認証
   * 2. プロフィール取得で登録状態確認
   * 3. 未登録ならdisplayNameで自動登録
   * 4. `redirectTo` へリダイレクト
   *
   * @param redirectTo - ログイン成功後の遷移先
   * @returns 画面に表示するエラーメッセージ。成功・キャンセル時は `null`
   */
  const loginWithGoogle = async (
    redirectTo: string
  ): Promise<string | null> => {
    try {
      // 1. Googleログイン
      await signInWithGoogle()

      // 2. ユーザー登録状態を確認
      try {
        await apiGet('/api/v1/user/profile')

        // 成功 = 既に登録済み
        await syncLoginProvider('FIREBASE_GOOGLE')
        trackEvent('web_login', { method: 'google' })
        router.push(redirectTo)
        return null
      } catch (profileError: unknown) {
        // profile APIのエラーをハンドリング

        // 退会済みアカウントの場合は復帰案内メッセージを表示する
        if (
          profileError instanceof ApiV1Error &&
          profileError.errorCode === 'USER_QUIT'
        ) {
          await signOut()
          trackEvent('login_error', {
            method: 'google',
            error_code: 'USER_QUIT',
          })
          return 'このアカウントは退会済みです。ご登録のメールアドレスに送信した復帰用のご案内をご確認ください。'
        }

        // エラーがApiV1Errorで、errorCodeが'USER_NOT_REGISTERED'かチェック
        const isUserNotRegistered =
          profileError instanceof ApiV1Error &&
          profileError.errorCode === 'USER_NOT_REGISTERED'

        if (isUserNotRegistered) {
          // 3. 未登録 → displayNameを使って自動登録
          const auth = getFirebaseAuth()
          const currentUser = auth.currentUser

          if (!currentUser) {
            throw new Error('認証情報の取得に失敗しました', {
              cause: profileError,
            })
          }

          // displayName のフォールバック
          const userName =
            currentUser.displayName?.trim() ||
            currentUser.email?.split('@')[0] ||
            'ユーザー'

          // register API呼び出し
          await apiPost('/api/v1/user/auth/register', { name: userName })

          // 4. 登録成功 → リダイレクト
          trackEvent('web_sign_up', { method: 'google' })
          trackEvent('web_login', { method: 'google' })
          router.push(redirectTo)
          return null
        }

        // USER_NOT_REGISTERED以外のエラー → 再スロー
        throw profileError
      }
    } catch (err) {
      const errorCode =
        err instanceof ApiV1Error
          ? err.errorCode
          : typeof err === 'object' &&
              err !== null &&
              'code' in err &&
              typeof err.code === 'string'
            ? err.code
            : undefined

      if (errorCode && GOOGLE_LOGIN_CANCEL_ERROR_CODES.includes(errorCode)) {
        return null
      }

      console.error('Google login error:', err)
      trackEvent('login_error', {
        method: 'google',
        error_code: errorCode,
      })

      // エラー時はログアウト
      await signOut()

      return errorCode && GOOGLE_LOGIN_GUIDED_ERROR_CODES.includes(errorCode)
        ? getFirebaseErrorMessage(errorCode)
        : 'Googleログインに失敗しました。もう一度お試しください。'
    }
  }

  return { loginWithGoogle }
}
