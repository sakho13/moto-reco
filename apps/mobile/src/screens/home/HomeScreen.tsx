import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Droplets, Navigation } from 'lucide-react-native'
import { AppButton } from '../../components/ui/AppButton'
import { AppCard } from '../../components/ui/AppCard'
import { themeTokens } from '../../theme'
import type { HomeScreenProps } from '../../types/navigation'

const DUMMY_BIKE_NAME = 'CB400SF'

type HistoryItem = {
  id: string
  type: 'fuel' | 'touring'
  label: string
  date: string
}

const DUMMY_HISTORY: HistoryItem[] = [
  { id: '1', type: 'fuel', label: '給油 - 12.5L / 320km', date: '2025-04-28' },
  { id: '2', type: 'touring', label: 'ツーリング - 箱根', date: '2025-04-20' },
  { id: '3', type: 'fuel', label: '給油 - 11.8L / 295km', date: '2025-04-15' },
]

export const HomeScreen = (_props: HomeScreenProps) => {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>ホーム</Text>

        <AppCard title="ツーリング">
          <Text style={styles.bikeLabel}>{DUMMY_BIKE_NAME}</Text>
          <AppButton variant="primary" fullWidth onPress={() => {}}>
            ツーリング開始
          </AppButton>
        </AppCard>

        <AppCard title="クイック給油">
          <Text style={styles.sectionDesc}>
            バイクを選択して給油を記録できます
          </Text>
          <AppButton variant="cloud" fullWidth onPress={() => {}}>
            給油を記録する
          </AppButton>
        </AppCard>

        <AppCard title="最近のヒストリー">
          <FlatList
            data={DUMMY_HISTORY}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                {item.type === 'fuel' ? (
                  <Droplets size={16} color={themeTokens.colors.product} />
                ) : (
                  <Navigation size={16} color={themeTokens.colors.success} />
                )}
                <View style={styles.historyText}>
                  <Text style={styles.historyLabel}>{item.label}</Text>
                  <Text style={styles.historyDate}>{item.date}</Text>
                </View>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeTokens.colors.cloud,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: themeTokens.spacing[4],
  },
  pageTitle: {
    fontSize: themeTokens.fontSizes['2xl'],
    fontWeight: '700',
    color: themeTokens.colors.inkDark,
    marginBottom: themeTokens.spacing[4],
  },
  bikeLabel: {
    fontSize: themeTokens.fontSizes.md,
    color: themeTokens.colors.ink,
    marginBottom: themeTokens.spacing[3],
  },
  sectionDesc: {
    fontSize: themeTokens.fontSizes.sm,
    color: themeTokens.colors.inkLight,
    marginBottom: themeTokens.spacing[3],
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeTokens.spacing[3],
  },
  historyText: {
    flex: 1,
  },
  historyLabel: {
    fontSize: themeTokens.fontSizes.sm,
    color: themeTokens.colors.inkDark,
    fontWeight: '500',
  },
  historyDate: {
    fontSize: themeTokens.fontSizes.xs,
    color: themeTokens.colors.inkLight,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: themeTokens.colors.cloud,
    marginVertical: themeTokens.spacing[2],
  },
})
