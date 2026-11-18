import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { FONTS, useAppTheme } from '@/theme'

type MessageViewProps = {
  /** 見出し */
  title: string
  /** 説明 */
  description?: string
  /** 下に置くボタンなど */
  children?: ReactNode
}

/**
 * データが無いとき・読み込みに失敗したときなどに、画面の中央に出す案内
 */
export function MessageView({
  title,
  description,
  children,
}: MessageViewProps) {
  const { colors, spacing, fontSizes } = useAppTheme()
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing[8],
        gap: spacing[3],
      }}
    >
      <Text
        style={{
          color: colors.ink,
          fontFamily: FONTS.display,
          fontSize: fontSizes.lg,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            color: colors.inkLight,
            fontSize: fontSizes.sm,
            textAlign: 'center',
            lineHeight: fontSizes.sm * 1.6,
          }}
        >
          {description}
        </Text>
      )}
      {children}
    </View>
  )
}
