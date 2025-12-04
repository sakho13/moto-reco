import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { Button } from '@repo/ui/button'

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moto Reco Mobile</Text>
      <Text style={styles.subtitle}>バイクメンテナンス管理アプリ</Text>
      <View style={styles.buttonContainer}>
        <Button appName="Mobile">共有UIボタン</Button>
      </View>
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 16,
  },
})
