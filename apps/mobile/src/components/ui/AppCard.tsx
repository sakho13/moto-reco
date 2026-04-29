import { StyleSheet, Text, View, type ViewProps } from 'react-native'
import { themeTokens } from '../../theme'

type AppCardProps = ViewProps & {
  title?: string
  children: React.ReactNode
}

export const AppCard = ({ title, children, style, ...props }: AppCardProps) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: themeTokens.colors.background,
    borderRadius: themeTokens.radius.lg,
    padding: themeTokens.spacing[4],
    marginBottom: themeTokens.spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: themeTokens.fontSizes.lg,
    fontWeight: '700',
    color: themeTokens.colors.inkDark,
    marginBottom: themeTokens.spacing[3],
  },
})
