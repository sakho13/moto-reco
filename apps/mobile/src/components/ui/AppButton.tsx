import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from 'react-native'
import { themeTokens } from '../../theme'

type ButtonVariant = 'primary' | 'danger' | 'social' | 'cloud'
type ButtonSize = 'sm' | 'md' | 'lg'

type AppButtonProps = TouchableOpacityProps & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: { bg: themeTokens.colors.product, text: '#FFFFFF' },
  danger: { bg: themeTokens.colors.danger, text: '#FFFFFF' },
  social: { bg: themeTokens.colors.social, text: '#FFFFFF' },
  cloud: { bg: themeTokens.colors.cloud, text: themeTokens.colors.ink },
}

const sizeStyles: Record<
  ButtonSize,
  { paddingVertical: number; paddingHorizontal: number; fontSize: number }
> = {
  sm: {
    paddingVertical: themeTokens.spacing[2],
    paddingHorizontal: themeTokens.spacing[3],
    fontSize: themeTokens.fontSizes.sm,
  },
  md: {
    paddingVertical: themeTokens.spacing[3],
    paddingHorizontal: themeTokens.spacing[4],
    fontSize: themeTokens.fontSizes.md,
  },
  lg: {
    paddingVertical: themeTokens.spacing[4],
    paddingHorizontal: themeTokens.spacing[6],
    fontSize: themeTokens.fontSizes.lg,
  },
}

export const AppButton = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}: AppButtonProps) => {
  const { bg, text } = variantStyles[variant]
  const { paddingVertical, paddingHorizontal, fontSize } = sizeStyles[size]

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: bg, paddingVertical, paddingHorizontal },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={text} size="small" />
      ) : (
        <Text style={[styles.label, { color: text, fontSize }]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: themeTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: '600',
  },
})
