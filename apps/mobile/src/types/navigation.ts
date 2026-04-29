import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps } from '@react-navigation/native'

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
}

export type AuthStackParamList = {
  Login: undefined
  Register: undefined
}

export type MainTabParamList = {
  Home: undefined
  MyBike: undefined
  History: undefined
  Profile: undefined
}

export type LoginScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Login'
>
export type RegisterScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'Register'
>

export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>
export type MyBikeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'MyBike'>,
  NativeStackScreenProps<RootStackParamList>
>
export type HistoryScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'History'>,
  NativeStackScreenProps<RootStackParamList>
>
export type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>
