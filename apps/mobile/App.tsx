import { StatusBar } from 'expo-status-bar'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from './components/Button'
import { Card } from './components/Card'
import { Code } from './components/Code'

export default function App() {
  const handlePress = () => {
    Alert.alert('Button Pressed', 'You clicked the button!')
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>moto-reco Mobile App</Text>
        <Text style={styles.subtitle}>
          Expo project with shared UI components
        </Text>

        <View>
          <Button>BUTTON</Button>
        </View>
      </ScrollView> */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>moto-reco Mobile App</Text>
        <Text style={styles.subtitle}>
          Expo project with shared UI components
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buttons</Text>
          <Button variant="primary" onPress={handlePress}>
            Primary Button
          </Button>
          <View style={styles.spacer} />
          <Button variant="danger" onPress={handlePress}>
            Danger Button
          </Button>
          <View style={styles.spacer} />
          <Button variant="social" onPress={handlePress} size="sm">
            Small Button
          </Button>
          {/* <View style={styles.spacer} />
          <Button variant="cloud" loading>
            Loading...
          </Button> */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cards</Text>
          <Card
            title="Documentation"
            href="https://github.com/sakho13/moto-reco"
          >
            Learn more about this project on GitHub
          </Card>
          <Card title="Expo" href="https://docs.expo.dev">
            Explore the Expo documentation
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Code</Text>
          <Text>
            Check out this code: <Code>npm run dev</Code>
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000000',
  },
  spacer: {
    height: 12,
  },
})
