import { type JSX } from 'react'
import { StyleSheet, Text, type TextStyle } from 'react-native'

export interface CodeProps {
  children: React.ReactNode
  style?: TextStyle
}

export function Code({ children, style }: CodeProps): JSX.Element {
  return <Text style={[styles.code, style]}>{children}</Text>
}

const styles = StyleSheet.create({
  code: {
    fontFamily: 'Courier',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    color: '#333333',
  },
})
