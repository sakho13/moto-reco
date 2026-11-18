import { Stack } from 'expo-router'
import { ActiveBikeProvider } from '@/features/bike/ActiveBikeProvider'
import { useAppTheme } from '@/theme'

/**
 * ログイン後の画面のまとまり
 */
export default function AppLayout() {
  const { colors } = useAppTheme()
  return (
    <ActiveBikeProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.ink,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="fuel-logs/new"
          options={{ title: '給油を記録', presentation: 'modal' }}
        />
        <Stack.Screen
          name="fuel-logs/[fuelLogId]"
          options={{ title: '給油の記録' }}
        />
      </Stack>
    </ActiveBikeProvider>
  )
}
