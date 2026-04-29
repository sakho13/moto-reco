import { useState } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthStack } from './AuthStack'
import { MainTabNavigator } from './MainTabNavigator'
import type { RootStackParamList } from '../types/navigation'

const Stack = createNativeStackNavigator<RootStackParamList>()

export const RootNavigator = () => {
  // TODO: Firebase Authと連携後にここで認証状態を管理する
  const [_isLoggedIn] = useState(true)

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {_isLoggedIn ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  )
}
