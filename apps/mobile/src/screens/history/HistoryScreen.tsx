import { FlatList, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Droplets, Navigation } from 'lucide-react-native'
import { themeTokens } from '../../theme'
import type { HistoryScreenProps } from '../../types/navigation'

type HistoryItem = {
  id: string
  type: 'fuel' | 'touring'
  label: string
  sub: string
  date: string
}

const DUMMY_HISTORY: HistoryItem[] = [
  {
    id: '1',
    type: 'fuel',
    label: '給油',
    sub: '12.5L · 320km走行',
    date: '2025-04-28',
  },
  {
    id: '2',
    type: 'touring',
    label: '箱根ツーリング',
    sub: '150km',
    date: '2025-04-20',
  },
  {
    id: '3',
    type: 'fuel',
    label: '給油',
    sub: '11.8L · 295km走行',
    date: '2025-04-15',
  },
  {
    id: '4',
    type: 'touring',
    label: '富士山ツーリング',
    sub: '220km',
    date: '2025-04-05',
  },
  {
    id: '5',
    type: 'fuel',
    label: '給油',
    sub: '13.2L · 340km走行',
    date: '2025-03-28',
  },
  {
    id: '6',
    type: 'fuel',
    label: '給油',
    sub: '10.5L · 260km走行',
    date: '2025-03-15',
  },
  {
    id: '7',
    type: 'touring',
    label: '伊豆ツーリング',
    sub: '180km',
    date: '2025-03-08',
  },
  {
    id: '8',
    type: 'fuel',
    label: '給油',
    sub: '12.0L · 305km走行',
    date: '2025-02-28',
  },
  {
    id: '9',
    type: 'touring',
    label: '奥多摩ツーリング',
    sub: '120km',
    date: '2025-02-15',
  },
  {
    id: '10',
    type: 'fuel',
    label: '給油',
    sub: '11.2L · 280km走行',
    date: '2025-02-05',
  },
]

export const HistoryScreen = (_props: HistoryScreenProps) => {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Text style={styles.pageTitle}>ヒストリー</Text>
      <FlatList
        data={DUMMY_HISTORY}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.iconWrapper}>
              {item.type === 'fuel' ? (
                <Droplets size={20} color={themeTokens.colors.product} />
              ) : (
                <Navigation size={20} color={themeTokens.colors.success} />
              )}
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemSub}>{item.sub}</Text>
            </View>
            <Text style={styles.itemDate}>{item.date}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeTokens.colors.cloud,
    paddingTop: themeTokens.spacing[4],
  },
  pageTitle: {
    fontSize: themeTokens.fontSizes['2xl'],
    fontWeight: '700',
    color: themeTokens.colors.inkDark,
    paddingHorizontal: themeTokens.spacing[4],
    marginBottom: themeTokens.spacing[4],
  },
  list: {
    paddingHorizontal: themeTokens.spacing[4],
    paddingBottom: themeTokens.spacing[4],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeTokens.colors.background,
    borderRadius: themeTokens.radius.lg,
    padding: themeTokens.spacing[4],
    gap: themeTokens.spacing[3],
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: themeTokens.radius.full,
    backgroundColor: themeTokens.colors.cloud,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: themeTokens.fontSizes.md,
    fontWeight: '600',
    color: themeTokens.colors.inkDark,
  },
  itemSub: {
    fontSize: themeTokens.fontSizes.xs,
    color: themeTokens.colors.inkLight,
    marginTop: 2,
  },
  itemDate: {
    fontSize: themeTokens.fontSizes.xs,
    color: themeTokens.colors.inkLight,
  },
  separator: {
    height: themeTokens.spacing[2],
  },
})
