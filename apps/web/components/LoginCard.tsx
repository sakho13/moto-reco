'use client'

import { UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { BaseCard } from '@repo/ui/baseCard'
import { Button } from '@repo/ui/button'
import { ErrorMessage } from '@repo/ui/errorMessage'
import { FormField } from '@repo/ui/formField'
import { Input } from '@repo/ui/input'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { trackEvent } from '@/lib/analytics'
import { apiGet, apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { getFirebaseAuth } from '@/lib/firebase/config'
import { useAuth } from '@/lib/hooks/useAuth'

export function LoginCard() {
  const router = useRouter()
  const { signInWithEmail, signInWithGoogle, signOut, signInAsGuest } =
    useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /**
   * メール/パスワードログイン処理
   *
   * @remarks
   * Firebase認証成功後にプロフィール取得APIで退会済み（USER_QUIT）かどうかを確認する。
   * 退会済みの場合はホームへ遷移させず、復帰案内メッセージを表示する。
   */
  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signInWithEmail(email, password)

      try {
        await apiGet('/api/v1/user/profile')
      } catch (profileError: unknown) {
        if (
          profileError instanceof ApiV1Error &&
          profileError.errorCode === 'USER_QUIT'
        ) {
          await signOut()
          trackEvent('login_error', {
            method: 'email',
            error_code: 'USER_QUIT',
          })
          setError(
            'このアカウントは退会済みです。ご登録のメールアドレスに送信した復帰用のご案内をご確認ください。'
          )
          return
        }
        // USER_QUIT以外のプロフィール取得エラーはログイン自体を妨げない
      }

      trackEvent('web_login', { method: 'email' })
      router.push('/app/home')
    } catch (err) {
      console.error('Login error:', err)
      trackEvent('login_error', {
        method: 'email',
        error_code:
          err instanceof ApiV1Error
            ? err.errorCode
            : typeof err === 'object' &&
                err !== null &&
                'code' in err &&
                typeof err.code === 'string'
              ? err.code
              : undefined,
      })
      setError(
        'ログインに失敗しました。メールアドレスとパスワードを確認してください。'
      )
    } finally {
      setLoading(false)
    }
  }

  /**
   * ゲストログイン処理
   *
   * フロー:
   * 1. Firebase匿名認証
   * 2. ゲストユーザー登録API呼び出し
   * 3. ホームへリダイレクト
   */
  const handleGuestLogin = async () => {
    setError(null)
    setLoading(true)

    try {
      await signInAsGuest()

      // ゲスト登録API呼び出し
      await apiPost('/api/v1/user/auth/guest/register', {})

      trackEvent('web_guest_login', { method: 'anonymous' })
      router.push('/app/home')
    } catch (err) {
      console.error('Guest login error:', err)
      await signOut()
      setError('ゲストログインに失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Googleログイン処理
   *
   * フロー:
   * 1. Google認証
   * 2. プロフィール取得で登録状態確認
   * 3. 未登録ならdisplayNameで自動登録
   * 4. ホームへリダイレクト
   */
  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)

    try {
      // 1. Googleログイン
      await signInWithGoogle()

      // 2. ユーザー登録状態を確認
      try {
        await apiGet('/api/v1/user/profile')

        // 成功 = 既に登録済み
        trackEvent('web_login', { method: 'google' })
        router.push('/app/home')
        return
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
          setError(
            'このアカウントは退会済みです。ご登録のメールアドレスに送信した復帰用のご案内をご確認ください。'
          )
          return
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

          // 4. 登録成功 → ホームへ
          trackEvent('web_sign_up', { method: 'google' })
          trackEvent('web_login', { method: 'google' })
          router.push('/app/home')
          return
        }

        // USER_NOT_REGISTERED以外のエラー → 再スロー
        throw profileError
      }
    } catch (err) {
      console.error('Google login error:', err)
      trackEvent('login_error', {
        method: 'google',
        error_code:
          err instanceof ApiV1Error
            ? err.errorCode
            : typeof err === 'object' &&
                err !== null &&
                'code' in err &&
                typeof err.code === 'string'
              ? err.code
              : undefined,
      })

      // エラー時はログアウト
      await signOut()

      setError('Googleログインに失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <BaseCard
      title="ログイン"
      footer={
        <p>
          アカウントをお持ちでない方は
          <Link href="/app/register">新規登録</Link>
        </p>
      }
    >
      {error && (
        <div className="pb-2">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      )}

      <form onSubmit={handleEmailLogin} className="flex flex-col">
        <FormField label="メールアドレス" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            placeholder="example@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoComplete="email"
          />
        </FormField>

        <FormField label="パスワード" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            autoComplete="current-password"
          />
        </FormField>

        <div className="mb-4 text-right text-sm">
          <Link href="/app/reset-password">パスワードをお忘れですか？</Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          ログイン
        </Button>
      </form>

      <div className="divider-label">
        <span>または</span>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          onClick={handleGoogleLogin}
          variant="social"
          size="icon"
          disabled={true}
          aria-label="Googleでログイン"
          title="Googleでログイン"
        >
          <GoogleIcon />
        </Button>

        <div className="flex flex-col items-center gap-1">
          <Button
            onClick={handleGuestLogin}
            variant="cloud"
            size="icon"
            loading={loading}
            aria-label="ゲストとして始める"
            title="ゲストとして始める"
          >
            <UserRound size={20} />
          </Button>
          <span className="text-xs" style={{ color: 'var(--color-inkLight)' }}>
            ゲスト
          </span>
        </div>
      </div>
    </BaseCard>
  )
}
