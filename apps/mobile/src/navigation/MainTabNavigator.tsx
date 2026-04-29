import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Home, Bike, ScrollText, User } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HomeScreen } from '../screens/home/HomeScreen'
import { MyBikeScreen } from '../screens/myBike/MyBikeScreen'
import { HistoryScreen } from '../screens/history/HistoryScreen'
import { ProfileScreen } from '../screens/profile/ProfileScreen'
import { themeTokens } from '../theme'
import type { MainTabParamList } from '../types/navigation'

const Tab = createBottomTabNavigator<MainTabParamList>()

const TAB_BAR_BASE_HEIGHT = 60

export const MainTabNavigator = () => {
  const insets = useSafeAreaInsets()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeTokens.colors.product,
        tabBarInactiveTintColor: themeTokens.colors.inkLight,
        tabBarStyle: {
          backgroundColor: themeTokens.colors.background,
          borderTopColor: themeTokens.colors.cloudHover,
          paddingTop: themeTokens.spacing[1],
          paddingBottom: insets.bottom + themeTokens.spacing[1],
          height: TAB_BAR_BASE_HEIGHT + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: themeTokens.fontSizes.xs,
          fontWeight: String(themeTokens.fontWeights.medium) as '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'ホーム',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MyBike"
        component={MyBikeScreen}
        options={{
          tabBarLabel: 'マイバイク',
          tabBarIcon: ({ color, size }) => <Bike color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'ヒストリー',
          tabBarIcon: ({ color, size }) => (
            <ScrollText color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'プロフィール',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}
