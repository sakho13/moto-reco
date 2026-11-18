import ChevronRight from 'lucide-react-native/icons/chevron-right'
import { Pressable, Text, View } from 'react-native'
import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import { formatDateTime } from '@repo/shared-utils'
import {
  formatKm,
  formatLiter,
  formatPricePerLiter,
  formatYen,
} from './fuelLogFormat'
import { FONTS, useAppTheme } from '@/theme'

type FuelLogListItemProps = {
  fuelLog: ApiResponseFuelLogDetail
  /** 燃費の欄の文言（`buildEfficiencyLabels` で決める） */
  efficiencyLabel: string
  onPress: () => void
}

/**
 * 給油履歴一覧の1行
 */
export function FuelLogListItem({
  fuelLog,
  efficiencyLabel,
  onPress,
}: FuelLogListItemProps) {
  const { colors, spacing, fontSizes, radius } = useAppTheme()
  const summary = [
    formatLiter(fuelLog.amount),
    formatYen(fuelLog.totalPrice),
    fuelLog.pricePerLiter !== null
      ? formatPricePerLiter(fuelLog.pricePerLiter)
      : null,
  ]
    .filter((part) => part !== null)
    .join(' ・ ')

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatDateTime(fuelLog.refueledAt)} の給油記録を開く`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
        backgroundColor: pressed ? colors.cloud : 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: colors.cloud,
      })}
    >
      <View style={{ flex: 1, gap: spacing[1] }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[2],
          }}
        >
          <Text style={{ color: colors.inkLight, fontSize: fontSizes.xs }}>
            {formatDateTime(fuelLog.refueledAt)}
          </Text>
          {!fuelLog.isFullTank && (
            <Text
              style={{
                color: colors.warning,
                borderColor: colors.warning,
                borderWidth: 1,
                borderRadius: radius.sm,
                paddingHorizontal: spacing[1],
                fontSize: fontSizes.xs,
              }}
            >
              継ぎ足し
            </Text>
          )}
        </View>
        <Text
          style={{
            color: colors.ink,
            fontFamily: FONTS.display,
            fontSize: fontSizes.lg,
          }}
        >
          {formatKm(fuelLog.mileage)}
        </Text>
        <Text style={{ color: colors.inkLight, fontSize: fontSizes.sm }}>
          {summary}
        </Text>
        {fuelLog.memo && (
          <Text
            numberOfLines={1}
            style={{ color: colors.inkLight, fontSize: fontSizes.xs }}
          >
            {fuelLog.memo}
          </Text>
        )}
      </View>
      <Text
        style={{
          color: fuelLog.fuelEfficiency !== null ? colors.ink : colors.inkLight,
          fontFamily: FONTS.display,
          fontSize: fontSizes.md,
        }}
      >
        {efficiencyLabel}
      </Text>
      <ChevronRight color={colors.inkLight} size={18} />
    </Pressable>
  )
}
