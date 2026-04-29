import { Alert, ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppButton } from '../../components/ui/AppButton'
import { AppCard } from '../../components/ui/AppCard'
import { themeTokens } from '../../theme'
import type { ProfileScreenProps } from '../../types/navigation'

export const ProfileScreen = (_props: ProfileScreenProps) => {
  const handleSignOut = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: () => {} },
    ])
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>プロフィール</Text>

        <AppCard title="アカウント情報">
          <Text style={styles.label}>ユーザー名</Text>
          <Text style={styles.value}>moto-reco ユーザー</Text>

          <Text style={[styles.label, styles.labelSpacing]}>
            メールアドレス
          </Text>
          <Text style={styles.value}>user@example.com</Text>

          <AppButton
            variant="cloud"
            size="sm"
            style={styles.editButton}
            onPress={() => {}}
          >
            プロフィールを編集
          </AppButton>
        </AppCard>

        <AppCard title="設定">
          <AppButton variant="danger" fullWidth onPress={handleSignOut}>
            ログアウト
          </AppButton>
        </AppCard>

        <Text style={styles.version}>moto-reco v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeTokens.colors.cloud,
  },
  content: {
    padding: themeTokens.spacing[4],
  },
  pageTitle: {
    fontSize: themeTokens.fontSizes['2xl'],
    fontWeight: '700',
    color: themeTokens.colors.inkDark,
    marginBottom: themeTokens.spacing[4],
  },
  label: {
    fontSize: themeTokens.fontSizes.xs,
    color: themeTokens.colors.inkLight,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelSpacing: {
    marginTop: themeTokens.spacing[3],
  },
  value: {
    fontSize: themeTokens.fontSizes.md,
    color: themeTokens.colors.inkDark,
    marginTop: 2,
  },
  editButton: {
    marginTop: themeTokens.spacing[4],
    alignSelf: 'flex-start',
  },
  version: {
    textAlign: 'center',
    fontSize: themeTokens.fontSizes.xs,
    color: themeTokens.colors.inkLight,
    marginTop: themeTokens.spacing[2],
  },
})
