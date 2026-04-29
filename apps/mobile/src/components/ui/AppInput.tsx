import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { themeTokens } from '../../theme'

type AppInputProps = TextInputProps & {
  label?: string
}

export const AppInput = ({ label, style, ...props }: AppInputProps) => {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={themeTokens.colors.inkLight}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: themeTokens.spacing[3],
  },
  label: {
    fontSize: themeTokens.fontSizes.sm,
    fontWeight: '500',
    color: themeTokens.colors.ink,
    marginBottom: themeTokens.spacing[1],
  },
  input: {
    borderWidth: 1,
    borderColor: themeTokens.colors.cloudHover,
    borderRadius: themeTokens.radius.md,
    paddingVertical: themeTokens.spacing[3],
    paddingHorizontal: themeTokens.spacing[4],
    fontSize: themeTokens.fontSizes.md,
    color: themeTokens.colors.inkDark,
    backgroundColor: themeTokens.colors.background,
  },
})
