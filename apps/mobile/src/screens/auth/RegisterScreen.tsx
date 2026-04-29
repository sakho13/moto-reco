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
import type { RegisterScreenProps } from '../../types/navigation'

export const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

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

          <AppCard title="新規登録">
            <AppInput
              label="ユーザー名"
              placeholder="ユーザー名"
              autoCapitalize="none"
              value={userName}
              onChangeText={setUserName}
            />
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
              placeholder="パスワード（8文字以上）"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <AppInput
              label="パスワード（確認）"
              placeholder="パスワードを再入力"
              secureTextEntry
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
            />
            <AppButton variant="primary" fullWidth onPress={() => {}}>
              登録する
            </AppButton>
          </AppCard>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              すでにアカウントをお持ちの方は
              <Text style={styles.loginHighlight}> ログイン</Text>
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
  loginLink: {
    marginTop: themeTokens.spacing[2],
    alignItems: 'center',
  },
  loginText: {
    fontSize: themeTokens.fontSizes.sm,
    color: themeTokens.colors.inkLight,
  },
  loginHighlight: {
    color: themeTokens.colors.product,
    fontWeight: '600',
  },
})
