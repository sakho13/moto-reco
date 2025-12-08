import { type JSX, type ReactNode } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native'

interface CardProps {
  style?: ViewStyle
  titleStyle?: TextStyle
  title: string
  children: ReactNode
  href: string
}

export function Card({
  style,
  titleStyle,
  title,
  children,
  href,
}: CardProps): JSX.Element {
  const handlePress = () => {
    Linking.openURL(
      `${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo`
    )
  }

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={handlePress}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        <Text style={styles.arrow}>→</Text>
      </View>
      <Text style={styles.content}>{children}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  arrow: {
    marginLeft: 8,
    fontSize: 18,
    color: '#666',
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
})
