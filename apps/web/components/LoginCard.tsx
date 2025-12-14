'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { ApiResponseUserProfile, SuccessResponse } from '@packages/shared-types'
import { AuthCard } from '@packages/ui/authCard'
import { Button } from '@packages/ui/button'
import { ErrorMessage } from '@packages/ui/errorMessage'
import { FormField } from '@packages/ui/formField'
import { Input } from '@packages/ui/input'
import { apiGet, apiPost } from '@/lib/api/client'
import { getFirebaseAuth } from '@/lib/firebase/config'
import { useAuth } from '@/lib/hooks/useAuth'

export function LoginCard() {
  const router = useRouter()
  const { signInWithEmail, signInWithGoogle, signOut } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /**
   * メール/パスワードログイン処理
   */
  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signInWithEmail(email, password)
      router.push('/home')
    } catch (err) {
      console.error('Login error:', err)
      setError(
        'ログインに失敗しました。メールアドレスとパスワードを確認してください。'
      )
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
        await apiGet<SuccessResponse<ApiResponseUserProfile>>(
          '/api/v1/user/profile'
        )

        // 成功 = 既に登録済み
        router.push('/')
        return
      } catch (profileError: unknown) {
        // profile APIのエラーをハンドリング

        // エラーがErrorオブジェクトで、messageに'USER_NOT_REGISTERED'が含まれるかチェック
        const isUserNotRegistered =
          profileError instanceof Error &&
          profileError.message.includes('USER_NOT_REGISTERED')

        if (isUserNotRegistered) {
          // 3. 未登録 → displayNameを使って自動登録
          const auth = getFirebaseAuth()
          const currentUser = auth.currentUser

          if (!currentUser) {
            throw new Error('認証情報の取得に失敗しました')
          }

          // displayName のフォールバック
          const userName =
            currentUser.displayName?.trim() ||
            currentUser.email?.split('@')[0] ||
            'ユーザー'

          // register API呼び出し
          await apiPost<SuccessResponse<ApiResponseUserProfile>>(
            '/api/v1/user/auth/register',
            { name: userName }
          )

          // 4. 登録成功 → ホームへ
          router.push('/')
          return
        }

        // USER_NOT_REGISTERED以外のエラー → 再スロー
        throw profileError
      }
    } catch (err) {
      console.error('Google login error:', err)

      // エラー時はログアウト
      await signOut()

      setError('Googleログインに失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="ログイン"
      footer={
        <p>
          アカウントをお持ちでない方は
          <Link href="/register">新規登録</Link>
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

      <div className="divider">
        <span>または</span>
      </div>

      <Button
        onClick={handleGoogleLogin}
        variant="social"
        size="lg"
        fullWidth
        disabled={loading}
      >
        Googleでログイン
      </Button>
    </AuthCard>
  )
}
