import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { AppButton } from '../../components/ui/AppButton'
import { AppCard } from '../../components/ui/AppCard'
import { AppInput } from '../../components/ui/AppInput'
import { themeTokens } from '../../theme'
import type { LoginScreenProps } from '../../types/navigation'

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.appTitle}>moto-reco</Text>

          <AppCard title="ログイン">
            <AppInput
              label="メールアドレス"
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <AppInput
              label="パスワード"
              placeholder="パスワード"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <AppButton variant="primary" fullWidth onPress={() => {}}>
              ログイン
            </AppButton>
          </AppCard>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              アカウントをお持ちでない方は
              <Text style={styles.registerHighlight}> 新規登録</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeTokens.colors.cloud,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: themeTokens.spacing[4],
    paddingTop: themeTokens.spacing[8],
    flexGrow: 1,
  },
  appTitle: {
    fontSize: themeTokens.fontSizes['3xl'],
    fontWeight: '700',
    color: themeTokens.colors.product,
    textAlign: 'center',
    marginBottom: themeTokens.spacing[8],
  },
  registerLink: {
    marginTop: themeTokens.spacing[2],
    alignItems: 'center',
  },
  registerText: {
    fontSize: themeTokens.fontSizes.sm,
    color: themeTokens.colors.inkLight,
  },
  registerHighlight: {
    color: themeTokens.colors.product,
    fontWeight: '600',
  },
})
