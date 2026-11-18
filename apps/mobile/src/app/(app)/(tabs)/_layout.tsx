import { Tabs } from 'expo-router'
import Fuel from 'lucide-react-native/icons/fuel'
import UserRound from 'lucide-react-native/icons/user-round'
import { useAppTheme } from '@/theme'

/**
 * 下部タブ（給油履歴・アカウント）
 */
export default function TabsLayout() {
  const { colors } = useAppTheme()
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.cloud,
        },
        tabBarActiveTintColor: colors.product,
        tabBarInactiveTintColor: colors.inkLight,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '給油履歴',
          tabBarIcon: ({ color, size }) => <Fuel color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'アカウント',
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}
