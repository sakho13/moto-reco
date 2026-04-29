import { type JSX } from 'react'
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export interface CardProps {
  title: string
  children: React.ReactNode
  href: string
}

export function Card({ title, children, href }: CardProps): JSX.Element {
  const handlePress = () => {
    const url = `${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo"`
    Linking.openURL(url)
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View>
        <Text style={styles.title}>
          {title} <Text style={styles.arrow}>-&gt;</Text>
        </Text>
        <Text style={styles.description}>{children}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  arrow: {
    color: '#007AFF',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
})
