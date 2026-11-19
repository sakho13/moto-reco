import { useRouter } from 'expo-router'
import Plus from 'lucide-react-native/icons/plus'
import { useMemo } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native'
import { AppButton } from '@/components/ui/AppButton'
import { LoadingView } from '@/components/ui/LoadingView'
import { MessageView } from '@/components/ui/MessageView'
import { BikeSwitcher } from '@/features/bike/BikeSwitcher'
import { useActiveBike } from '@/features/bike/useActiveBike'
import { buildEfficiencyLabels } from '@/features/fuelLog/efficiencyLabel'
import { FuelLogListItem } from '@/features/fuelLog/FuelLogListItem'
import { useActiveBikeFuelLogs } from '@/features/fuelLog/FuelLogsProvider'
import { getErrorMessage } from '@/lib/errorMessage'
import { useAppTheme } from '@/theme'

/**
 * 給油履歴の一覧画面
 */
export default function FuelLogListScreen() {
  const router = useRouter()
  const theme = useAppTheme()
  const { colors, spacing, fontSizes, radius } = theme
  const {
    activeBike,
    isLoading: isBikesLoading,
    error: bikesError,
    refreshBikes,
  } = useActiveBike()
  const {
    fuelLogs,
    error,
    isLoading,
    isRefreshing,
    isLoadingMore,
    loadMore,
    refresh,
  } = useActiveBikeFuelLogs()

  const efficiencyLabels = useMemo(
    () => buildEfficiencyLabels(fuelLogs),
    [fuelLogs]
  )

  if (isBikesLoading) {
    return <LoadingView />
  }

  if (bikesError) {
    return (
      <MessageView
        title="愛車を読み込めませんでした"
        description={getErrorMessage(
          bikesError,
          'しばらくしてからもう一度お試しください。'
        )}
      >
        <AppButton
          label="もう一度読み込む"
          variant="secondary"
          onPress={() => void refreshBikes()}
        />
      </MessageView>
    )
  }

  if (!activeBike) {
    return (
      <MessageView
        title="愛車が登録されていません"
        description="給油を記録するには、先に Web 版で愛車を登録してください。登録後に下のボタンで読み込み直せます。"
      >
        <AppButton
          label="読み込み直す"
          variant="secondary"
          onPress={() => void refreshBikes()}
        />
      </MessageView>
    )
  }

  const handleRefresh = () => {
    void refresh()
    void refreshBikes()
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={fuelLogs}
        keyExtractor={(item) => item.fuelLogId}
        renderItem={({ item }) => (
          <FuelLogListItem
            fuelLog={item}
            efficiencyLabel={efficiencyLabels.get(item.fuelLogId) ?? ''}
            onPress={() => router.push(`/fuel-logs/${item.fuelLogId}`)}
          />
        )}
        ListHeaderComponent={<BikeSwitcher />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              color={colors.product}
              style={{ marginTop: spacing[10] }}
            />
          ) : error ? (
            <MessageView
              title="給油履歴を読み込めませんでした"
              description={getErrorMessage(
                error,
                '下に引っ張って読み込み直してください。'
              )}
            />
          ) : (
            <MessageView
              title="まだ給油の記録がありません"
              description="右下のボタンから、最初の給油を記録しましょう。"
            />
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              color={colors.product}
              style={{ marginVertical: spacing[4] }}
            />
          ) : undefined
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.product}
            colors={[colors.product]}
          />
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 96 }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="給油を記録"
        onPress={() => router.push('/fuel-logs/new')}
        style={({ pressed }) => ({
          position: 'absolute',
          right: spacing[5],
          bottom: spacing[5],
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[2],
          paddingHorizontal: spacing[5],
          minHeight: 52,
          borderRadius: radius.full,
          backgroundColor: pressed ? colors.productActive : colors.product,
          boxShadow: theme.shadows.md,
        })}
      >
        <Plus color={colors.productInk} size={20} />
        <Text
          style={{
            color: colors.productInk,
            fontSize: fontSizes.md,
            fontWeight: theme.fontWeights.bold,
          }}
        >
          給油を記録
        </Text>
      </Pressable>
    </View>
  )
}
