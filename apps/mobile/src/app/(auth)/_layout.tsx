import { Stack } from 'expo-router'
import { useAppTheme } from '@/theme'

/**
 * ログイン・新規登録の画面のまとまり
 */
export default function AuthLayout() {
  const { colors } = useAppTheme()
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ title: '新規登録' }} />
    </Stack>
  )
}
