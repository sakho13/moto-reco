import { ActivityIndicator, View } from 'react-native'
import { useAppTheme } from '@/theme'

/**
 * 画面全体の読み込み中表示
 */
export function LoadingView() {
  const { colors } = useAppTheme()
  return (
    <View
      accessibilityLabel="読み込み中"
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator color={colors.product} size="large" />
    </View>
  )
}
