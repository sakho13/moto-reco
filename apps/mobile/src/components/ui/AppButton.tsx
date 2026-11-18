import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native'
import { FONTS, useAppTheme, type AppTheme } from '@/theme'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

type AppButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  /** ボタンの文言 */
  label: string
  /** 見た目の種類（既定: primary） */
  variant?: ButtonVariant
  /** 処理中はスピナーを出して押せなくする */
  loading?: boolean
}

/** 見た目の種類ごとの塗り・枠・文字の色 */
function getVariantColors(theme: AppTheme, variant: ButtonVariant) {
  const { colors } = theme
  switch (variant) {
    case 'primary':
      return {
        background: colors.product,
        pressed: colors.productActive,
        border: colors.product,
        text: colors.productInk,
      }
    case 'danger':
      return {
        background: 'transparent',
        pressed: colors.cloud,
        border: colors.danger,
        text: colors.danger,
      }
    case 'secondary':
      return {
        background: 'transparent',
        pressed: colors.cloud,
        border: colors.cloudActive,
        text: colors.ink,
      }
  }
}

/**
 * アプリ共通のボタン
 */
export function AppButton({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  ...pressableProps
}: AppButtonProps) {
  const theme = useAppTheme()
  const colors = getVariantColors(theme, variant)
  const isDisabled = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? colors.pressed : colors.background,
          borderColor: colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing[4],
          opacity: isDisabled ? 0.6 : 1,
        },
        variant === 'primary' && { boxShadow: theme.shadows.sm },
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: colors.text,
              fontSize: theme.fontSizes.md,
              fontWeight: theme.fontWeights.bold,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  label: {
    fontFamily: FONTS.body,
  },
})
