import { forwardRef } from 'react'
import {
  ActivityIndicator,
  type GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native'

/**
 * Buttonコンポーネントのプロパティ
 */
export interface ButtonProps {
  /**
   * ボタンのバリアント
   * @default 'primary'
   */
  variant?: 'primary' | 'danger' | 'social' | 'cloud'
  /**
   * ボタンのサイズ
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * ローディング状態
   * @default false
   */
  loading?: boolean
  /**
   * フル幅表示
   * @default false
   */
  fullWidth?: boolean
  /**
   * 無効状態
   * @default false
   */
  disabled?: boolean
  /**
   * ボタンのテキスト
   */
  children: React.ReactNode
  /**
   * クリックイベント
   */
  onPress?: (event: GestureResponderEvent) => void
  /**
   * カスタムスタイル
   */
  style?: ViewStyle
}

/**
 * Buttonコンポーネント (React Native版)
 *
 * @remarks
 * React Native用のボタンコンポーネント。
 * variant、size、loading状態、fullWidthオプションをサポート。
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onPress={handlePress}>
 *   クリック
 * </Button>
 *
 * <Button variant="danger" loading>
 *   処理中...
 * </Button>
 * ```
 */
export const Button = forwardRef<TouchableOpacity, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled = false,
      children,
      onPress,
      style,
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    const buttonStyles = [
      styles.button,
      styles[variant],
      styles[`size_${size}`],
      fullWidth && styles.fullWidth,
      isDisabled && styles.disabled,
      style,
    ]

    const textStyles = [
      styles.text,
      styles[`text_${variant}`],
      styles[`text_${size}`],
      isDisabled && styles.textDisabled,
    ]

    return (
      <TouchableOpacity
        ref={ref}
        style={buttonStyles}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {loading && (
          <ActivityIndicator
            color={variant === 'primary' ? '#ffffff' : '#000000'}
            style={styles.spinner}
          />
        )}
        <Text style={[textStyles, loading && styles.hiddenText]}>
          {children}
        </Text>
      </TouchableOpacity>
    )
  }
)

Button.displayName = 'Button'

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  danger: {
    backgroundColor: '#FF3B30',
  },
  social: {
    backgroundColor: '#34C759',
  },
  cloud: {
    backgroundColor: '#5856D6',
  },
  size_sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  size_md: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  size_lg: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_primary: {
    color: '#ffffff',
  },
  text_danger: {
    color: '#ffffff',
  },
  text_social: {
    color: '#ffffff',
  },
  text_cloud: {
    color: '#ffffff',
  },
  text_sm: {
    fontSize: 14,
  },
  text_md: {
    fontSize: 16,
  },
  text_lg: {
    fontSize: 18,
  },
  textDisabled: {
    opacity: 0.7,
  },
  spinner: {
    marginRight: 8,
  },
  hiddenText: {
    opacity: 0,
  },
})
