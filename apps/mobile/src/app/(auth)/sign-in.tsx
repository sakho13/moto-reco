import { Link } from 'expo-router'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { validateEmail } from '@repo/shared-utils'
import { AppButton } from '@/components/ui/AppButton'
import { AppTextField } from '@/components/ui/AppTextField'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { FormScreen } from '@/components/ui/FormScreen'
import { useAuth } from '@/features/auth/useAuth'
import { getErrorMessage } from '@/lib/errorMessage'
import { FONTS, useAppTheme } from '@/theme'

/**
 * ログイン画面
 *
 * @remarks
 * Web の `LoginCard` と同じく、Firebase でログインした後にプロフィールを取得し、
 * 退会済みのアカウントならログアウトしてメッセージを出す。
 */
export default function SignInScreen() {
  const { signIn, notice, clearNotice } = useAuth()
  const { colors, spacing, fontSizes } = useAppTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    clearNotice()
    setFormError(null)
    const nextEmailError = validateEmail(email)
    const nextPasswordError = password ? null : 'パスワードを入力してください'
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    if (nextEmailError || nextPasswordError) return

    setLoading(true)
    try {
      await signIn(email.trim(), password)
    } catch (error: unknown) {
      setFormError(
        getErrorMessage(
          error,
          'ログインに失敗しました。もう一度お試しください。'
        )
      )
    } finally {
      setLoading(false)
    }
  }

  const message = formError ?? notice

  return (
    <FormScreen edges={['top', 'bottom', 'left', 'right']}>
      <View style={{ marginTop: spacing[10], gap: spacing[2] }}>
        <Text
          accessibilityRole="header"
          style={{
            color: colors.product,
            fontFamily: FONTS.display,
            fontSize: fontSizes['3xl'],
          }}
        >
          モトレコ
        </Text>
        <Text style={{ color: colors.inkLight, fontSize: fontSizes.sm }}>
          愛車の給油・整備・ツーリングを記録する整備手帳
        </Text>
      </View>

      {message && <ErrorBanner message={message} />}

      <AppTextField
        label="メールアドレス"
        value={email}
        onChangeText={setEmail}
        error={emailError}
        placeholder="example@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        editable={!loading}
      />
      <AppTextField
        label="パスワード"
        value={password}
        onChangeText={setPassword}
        error={passwordError}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        editable={!loading}
        onSubmitEditing={handleSubmit}
      />

      <AppButton label="ログイン" loading={loading} onPress={handleSubmit} />

      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ color: colors.inkLight, fontSize: fontSizes.sm }}>
          アカウントをお持ちでない方は
        </Text>
        <Link
          href="/sign-up"
          style={{ color: colors.social, fontSize: fontSizes.sm }}
        >
          新規登録
        </Link>
      </View>
    </FormScreen>
  )
}
