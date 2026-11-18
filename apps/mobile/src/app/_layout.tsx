import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SWRConfig } from 'swr'
import { LoadingView } from '@/components/ui/LoadingView'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { useAuth } from '@/features/auth/useAuth'
import { SWR_CONFIG } from '@/lib/swrConfig'
import { useAppTheme } from '@/theme'

/**
 * 認証状態に合わせて、表示できる画面のまとまりを切り替える
 *
 * @remarks
 * `Stack.Protected` の `guard` が false の画面には遷移できず、表示中なら
 * 表示できる最初の画面へ自動で移る。
 */
function RootNavigator() {
  const { status } = useAuth()
  const theme = useAppTheme()

  if (status === 'initializing') {
    return <LoadingView />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'needsRegistration'}>
        <Stack.Screen name="complete-registration" />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  )
}

/**
 * アプリ全体のレイアウト
 */
export default function RootLayout() {
  const theme = useAppTheme()
  return (
    <SWRConfig value={SWR_CONFIG}>
      <AuthProvider>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
        <RootNavigator />
      </AuthProvider>
    </SWRConfig>
  )
}
