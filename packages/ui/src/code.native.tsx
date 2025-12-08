import { type JSX, type ReactNode } from 'react'
import { Text, StyleSheet, TextStyle } from 'react-native'

interface CodeProps {
  children: ReactNode
  style?: TextStyle
}

export function Code({ children, style }: CodeProps): JSX.Element {
  return <Text style={[styles.code, style]}>{children}</Text>
}

const styles = StyleSheet.create({
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f4f4f4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    color: '#1a1a1a',
  },
})
