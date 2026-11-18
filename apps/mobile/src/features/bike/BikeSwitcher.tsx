import { Pressable, ScrollView, Text, View } from 'react-native'
import { getBikeDisplayMeta, getBikeDisplayName } from '@repo/shared-utils'
import { useActiveBike } from './useActiveBike'
import { FONTS, useAppTheme } from '@/theme'

/**
 * 選択中の愛車の表示と、愛車の切り替え
 *
 * @remarks
 * 愛車が2台以上あるときだけ、切り替え用のボタンを横に並べる。
 */
export function BikeSwitcher() {
  const { bikes, activeBike, selectBike } = useActiveBike()
  const { colors, spacing, fontSizes, radius } = useAppTheme()

  if (!activeBike) return null

  return (
    <View
      style={{
        gap: spacing[2],
        paddingTop: spacing[3],
        paddingBottom: spacing[2],
      }}
    >
      <View style={{ paddingHorizontal: spacing[4] }}>
        <Text
          style={{
            color: colors.ink,
            fontFamily: FONTS.display,
            fontSize: fontSizes.xl,
          }}
        >
          {getBikeDisplayName(activeBike)}
        </Text>
        <Text style={{ color: colors.inkLight, fontSize: fontSizes.xs }}>
          {getBikeDisplayMeta(activeBike)}
        </Text>
      </View>
      {bikes.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: spacing[2],
            paddingHorizontal: spacing[4],
          }}
        >
          {bikes.map((bike) => {
            const selected = bike.myUserBikeId === activeBike.myUserBikeId
            return (
              <Pressable
                key={bike.myUserBikeId}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => selectBike(bike.myUserBikeId)}
                style={{
                  borderWidth: 1.5,
                  borderColor: selected ? colors.product : colors.cloudActive,
                  backgroundColor: selected ? colors.product : 'transparent',
                  borderRadius: radius.full,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[1],
                }}
              >
                <Text
                  style={{
                    color: selected ? colors.productInk : colors.ink,
                    fontSize: fontSizes.sm,
                  }}
                >
                  {getBikeDisplayName(bike)}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}
