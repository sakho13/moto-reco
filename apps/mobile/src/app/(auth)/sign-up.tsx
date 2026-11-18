import { useState } from 'react'
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordMatch,
} from '@repo/shared-utils'
import { AppButton } from '@/components/ui/AppButton'
import { AppTextField } from '@/components/ui/AppTextField'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { FormScreen } from '@/components/ui/FormScreen'
import { useAuth } from '@/features/auth/useAuth'
import { getErrorMessage } from '@/lib/errorMessage'

type SignUpErrors = {
  name: string | null
  email: string | null
  password: string | null
  confirmPassword: string | null
}

const NO_ERRORS: SignUpErrors = {
  name: null,
  email: null,
  password: null,
  confirmPassword: null,
}

/**
 * 新規登録画面
 *
 * @remarks
 * Web の `RegisterCard` と同じく、Firebase でアカウントを作った後に
 * ユーザー登録 API（`POST /api/v1/user/auth/register`）を呼ぶ。
 * 入力チェックの文言は `@repo/shared-utils` で Web と揃えている。
 */
export default function SignUpScreen() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<SignUpErrors>(NO_ERRORS)
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setFormError(null)
    const nextErrors: SignUpErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validatePasswordMatch(password, confirmPassword),
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some((error) => error !== null)) return

    setLoading(true)
    try {
      await register({ name, email: email.trim(), password })
    } catch (error: unknown) {
      setFormError(
        getErrorMessage(
          error,
          'アカウントの作成に失敗しました。もう一度お試しください。'
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormScreen>
      {formError && <ErrorBanner message={formError} />}

      <AppTextField
        label="ユーザー名"
        required
        value={name}
        onChangeText={setName}
        error={errors.name}
        placeholder="太郎"
        autoComplete="name"
        textContentType="nickname"
        editable={!loading}
      />
      <AppTextField
        label="メールアドレス"
        required
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        placeholder="example@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        editable={!loading}
      />
      <AppTextField
        label="パスワード"
        required
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        helperText="8文字以上、英字と数字を含む"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!loading}
      />
      <AppTextField
        label="パスワード（確認）"
        required
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!loading}
        onSubmitEditing={handleSubmit}
      />

      <AppButton
        label="アカウントを作成"
        loading={loading}
        onPress={handleSubmit}
      />
    </FormScreen>
  )
}
