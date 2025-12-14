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
import { apiPost } from '@/lib/api/client'
import { getFirebaseErrorMessage } from '@/lib/constants/errorMessages'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordMatch,
} from '@/lib/utils/validation'

export function RegisterCard() {
  const router = useRouter()
  const { registerWithEmail } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')

  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)

  /**
   * フォームバリデーション
   * @returns バリデーションが成功した場合はtrue
   */
  const validateForm = (): boolean => {
    let isValid = true

    // メールアドレスのバリデーション
    const emailErr = validateEmail(email)
    setEmailError(emailErr)
    if (emailErr) isValid = false

    // パスワードのバリデーション
    const passwordErr = validatePassword(password)
    setPasswordError(passwordErr)
    if (passwordErr) isValid = false

    // パスワード確認のバリデーション
    const confirmPasswordErr = validatePasswordMatch(password, confirmPassword)
    setConfirmPasswordError(confirmPasswordErr)
    if (confirmPasswordErr) isValid = false

    // ユーザー名のバリデーション
    const nameErr = validateName(name)
    setNameError(nameErr)
    if (nameErr) isValid = false

    return isValid
  }

  /**
   * 新規登録処理
   */
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setGlobalError(null)
    setEmailError(null)
    setPasswordError(null)
    setConfirmPasswordError(null)
    setNameError(null)

    // バリデーション
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // 1. Firebase Authenticationでアカウント作成
      const token = await registerWithEmail(email, password)

      // 2. IDトークン取得
      if (!token) {
        throw new Error('IDトークンの取得に失敗しました')
      }

      // 3. API呼び出し: ユーザー情報登録
      await apiPost<SuccessResponse<ApiResponseUserProfile>>(
        '/api/v1/user/auth/register',
        { name: name.trim() }
      )

      // 4. ホームページへリダイレクト
      router.push('/home')
    } catch (err: unknown) {
      console.error('Registration error:', err)

      // Firebaseエラーの場合
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        typeof err.code === 'string' &&
        err.code.startsWith('auth/')
      ) {
        const firebaseError = getFirebaseErrorMessage(err.code)
        setGlobalError(firebaseError)
      } else {
        // API呼び出しエラーまたはその他のエラー
        setGlobalError(
          'アカウントの作成に失敗しました。もう一度お試しください。'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="新規登録"
      footer={
        <p>
          すでにアカウントをお持ちの方は
          <Link href="/login">ログイン</Link>
        </p>
      }
    >
      {globalError && <ErrorMessage>{globalError}</ErrorMessage>}

      <form onSubmit={handleRegister} className="flex flex-col">
        <FormField
          label="ユーザー名"
          htmlFor="name"
          required
          error={nameError || undefined}
        >
          <Input
            id="name"
            type="text"
            placeholder="太郎"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!nameError}
            required
            disabled={loading}
            autoComplete="name"
          />
        </FormField>

        <FormField
          label="メールアドレス"
          htmlFor="email"
          required
          error={emailError || undefined}
        >
          <Input
            id="email"
            type="email"
            placeholder="example@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!emailError}
            required
            disabled={loading}
            autoComplete="email"
          />
        </FormField>

        <FormField
          label="パスワード"
          htmlFor="password"
          required
          error={passwordError || undefined}
          helperText="8文字以上、英字と数字を含む"
        >
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!passwordError}
            required
            disabled={loading}
            autoComplete="new-password"
          />
        </FormField>

        <FormField
          label="パスワード（確認）"
          htmlFor="confirmPassword"
          required
          error={confirmPasswordError || undefined}
        >
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!confirmPasswordError}
            required
            disabled={loading}
            autoComplete="new-password"
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          登録する
        </Button>
      </form>
    </AuthCard>
  )
}
