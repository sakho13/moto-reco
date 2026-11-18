import type { ComponentProps } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { FONTS, useAppTheme } from '@/theme'

type AppTextFieldProps = ComponentProps<typeof TextInput> & {
  /** 入力欄の見出し */
  label: string
  /** 必須項目なら見出しに印を付ける */
  required?: boolean
  /** 入力内容のエラー。あれば枠を赤くして下に表示する */
  error?: string | null
  /** 入力の補足（エラーが無いときだけ表示する） */
  helperText?: string
  /** 入力欄の右に添える単位（例: km） */
  unit?: string
}

/**
 * 見出し・エラー表示付きのテキスト入力欄
 */
export function AppTextField({
  label,
  required,
  error,
  helperText,
  unit,
  editable = true,
  style,
  ...inputProps
}: AppTextFieldProps) {
  const theme = useAppTheme()
  const { colors, spacing, fontSizes, radius } = theme

  return (
    <View style={{ gap: spacing[1] }}>
      <Text
        style={[
          styles.label,
          {
            color: colors.ink,
            fontSize: fontSizes.sm,
            fontWeight: theme.fontWeights.medium,
          },
        ]}
      >
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <View
        style={[
          styles.inputRow,
          {
            borderColor: error ? colors.danger : colors.cloudActive,
            borderRadius: radius.md,
            backgroundColor: 'transparent',
            paddingHorizontal: spacing[3],
            opacity: editable ? 1 : 0.6,
          },
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          editable={editable}
          placeholderTextColor={colors.inkLight}
          style={[
            styles.input,
            { color: colors.ink, fontSize: fontSizes.md },
            style,
          ]}
          {...inputProps}
        />
        {unit && (
          <Text style={{ color: colors.inkLight, fontSize: fontSizes.sm }}>
            {unit}
          </Text>
        )}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.danger, fontSize: fontSizes.xs }}
        >
          {error}
        </Text>
      ) : (
        helperText && (
          <Text style={{ color: colors.inkLight, fontSize: fontSizes.xs }}>
            {helperText}
          </Text>
        )
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.body,
  },
  inputRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: FONTS.body,
  },
})
