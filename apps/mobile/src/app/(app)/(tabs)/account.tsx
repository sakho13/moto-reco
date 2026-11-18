import { Alert, ScrollView, Text, View } from 'react-native'
import { AppButton } from '@/components/ui/AppButton'
import { useAuth } from '@/features/auth/useAuth'
import { FONTS, useAppTheme } from '@/theme'

/** 見出しと値の1行 */
function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors, spacing, fontSizes } = useAppTheme()
  return (
    <View
      style={{
        paddingVertical: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.cloud,
        gap: spacing[1],
      }}
    >
      <Text style={{ color: colors.inkLight, fontSize: fontSizes.xs }}>
        {label}
      </Text>
      <Text style={{ color: colors.ink, fontSize: fontSizes.md }}>{value}</Text>
    </View>
  )
}

/**
 * アカウント画面（ユーザー名・メールアドレスの確認とログアウト）
 */
export default function AccountScreen() {
  const { profile, user, signOut } = useAuth()
  const { colors, spacing, fontSizes } = useAppTheme()

  const handleSignOut = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ])
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing[6], gap: spacing[6] }}
    >
      <View>
        <Text
          style={{
            color: colors.ink,
            fontFamily: FONTS.display,
            fontSize: fontSizes.lg,
            marginBottom: spacing[2],
          }}
        >
          プロフィール
        </Text>
        <InfoRow label="ユーザー名" value={profile?.name ?? '—'} />
        <InfoRow label="メールアドレス" value={user?.email ?? '—'} />
      </View>
      <Text style={{ color: colors.inkLight, fontSize: fontSizes.xs }}>
        プロフィールの変更・退会は Web 版から行えます。
      </Text>
      <AppButton label="ログアウト" variant="danger" onPress={handleSignOut} />
    </ScrollView>
  )
}
