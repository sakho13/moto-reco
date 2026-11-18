import { Text, View } from 'react-native'
import { useAppTheme } from '@/theme'

/**
 * フォーム全体のエラーを伝える帯
 */
export function ErrorBanner({ message }: { message: string }) {
  const { colors, spacing, radius, fontSizes } = useAppTheme()
  return (
    <View
      accessibilityRole="alert"
      style={{
        borderWidth: 1.5,
        borderColor: colors.danger,
        borderRadius: radius.md,
        padding: spacing[3],
      }}
    >
      <Text style={{ color: colors.danger, fontSize: fontSizes.sm }}>
        {message}
      </Text>
    </View>
  )
}
