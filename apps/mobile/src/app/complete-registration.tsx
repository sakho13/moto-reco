import { useState } from 'react'
import { Text } from 'react-native'
import { validateName } from '@repo/shared-utils'
import { AppButton } from '@/components/ui/AppButton'
import { AppTextField } from '@/components/ui/AppTextField'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { FormScreen } from '@/components/ui/FormScreen'
import { useAuth } from '@/features/auth/useAuth'
import { getErrorMessage } from '@/lib/errorMessage'
import { FONTS, useAppTheme } from '@/theme'

/**
 * ユーザー名の登録を済ませる画面
 *
 * @remarks
 * 新規登録で Firebase のアカウントはできたが、ユーザー登録 API が失敗した
 * （通信が切れた等）ときに表示する。ここでユーザー名を登録し直すか、
 * ログアウトして別のアカウントでログインできる。
 */
export default function CompleteRegistrationScreen() {
  const { completeRegistration, signOut, notice, user } = useAuth()
  const { colors, spacing, fontSizes } = useAppTheme()
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setFormError(null)
    const nextNameError = validateName(name)
    setNameError(nextNameError)
    if (nextNameError) return

    setLoading(true)
    try {
      await completeRegistration(name)
    } catch (error: unknown) {
      setFormError(
        getErrorMessage(
          error,
          'ユーザー登録に失敗しました。もう一度お試しください。'
        )
      )
    } finally {
      setLoading(false)
    }
  }

  const message = formError ?? notice

  return (
    <FormScreen edges={['top', 'bottom', 'left', 'right']}>
      <Text
        accessibilityRole="header"
        style={{
          marginTop: spacing[8],
          color: colors.ink,
          fontFamily: FONTS.display,
          fontSize: fontSizes['2xl'],
        }}
      >
        ユーザー名の登録
      </Text>
      <Text style={{ color: colors.inkLight, fontSize: fontSizes.sm }}>
        {user?.email
          ? `${user.email} のアカウントで使うユーザー名を登録してください。`
          : 'アプリで使うユーザー名を登録してください。'}
      </Text>

      {message && <ErrorBanner message={message} />}

      <AppTextField
        label="ユーザー名"
        required
        value={name}
        onChangeText={setName}
        error={nameError}
        placeholder="太郎"
        textContentType="nickname"
        editable={!loading}
        onSubmitEditing={handleSubmit}
      />
      <AppButton label="登録する" loading={loading} onPress={handleSubmit} />
      <AppButton
        label="ログアウト"
        variant="secondary"
        disabled={loading}
        onPress={() => void signOut()}
      />
    </FormScreen>
  )
}
