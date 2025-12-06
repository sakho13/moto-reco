import { ReactNode } from 'react'
import {
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native'

interface ButtonProps {
  children: ReactNode
  style?: ViewStyle
  textStyle?: TextStyle
  appName: string
}

export const Button = ({ children, style, textStyle, appName }: ButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={() => Alert.alert('Hello', `Hello from your ${appName} app!`)}
    >
      <Text style={[styles.text, textStyle]}>{children}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})
