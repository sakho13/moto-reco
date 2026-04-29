import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronRight } from 'lucide-react-native'
import { AppButton } from '../../components/ui/AppButton'
import { AppCard } from '../../components/ui/AppCard'
import { themeTokens } from '../../theme'
import type { MyBikeScreenProps } from '../../types/navigation'

type BikeItem = {
  id: string
  name: string
  maker: string
  year: number
}

const DUMMY_BIKES: BikeItem[] = [
  { id: '1', name: 'CB400SF', maker: 'Honda', year: 2020 },
  { id: '2', name: 'Z900RS', maker: 'Kawasaki', year: 2022 },
]

export const MyBikeScreen = (_props: MyBikeScreenProps) => {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>マイバイク</Text>

        <AppCard>
          <AppButton variant="primary" fullWidth onPress={() => {}}>
            バイクを登録する
          </AppButton>
        </AppCard>

        <FlatList
          data={DUMMY_BIKES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.bikeCard} onPress={() => {}}>
              <View style={styles.bikeInfo}>
                <Text style={styles.bikeName}>{item.name}</Text>
                <Text style={styles.bikeSub}>
                  {item.maker} · {item.year}年式
                </Text>
              </View>
              <ChevronRight size={20} color={themeTokens.colors.inkLight} />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeTokens.colors.cloud,
  },
  container: {
    flex: 1,
    padding: themeTokens.spacing[4],
  },
  pageTitle: {
    fontSize: themeTokens.fontSizes['2xl'],
    fontWeight: '700',
    color: themeTokens.colors.inkDark,
    marginBottom: themeTokens.spacing[4],
  },
  list: {
    gap: themeTokens.spacing[3],
  },
  bikeCard: {
    backgroundColor: themeTokens.colors.background,
    borderRadius: themeTokens.radius.lg,
    padding: themeTokens.spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bikeInfo: {
    flex: 1,
  },
  bikeName: {
    fontSize: themeTokens.fontSizes.md,
    fontWeight: '700',
    color: themeTokens.colors.inkDark,
  },
  bikeSub: {
    fontSize: themeTokens.fontSizes.sm,
    color: themeTokens.colors.inkLight,
    marginTop: 2,
  },
})
