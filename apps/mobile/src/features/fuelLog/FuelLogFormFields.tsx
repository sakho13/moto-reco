import { Pressable, Text, View } from 'react-native'
import {
  FUEL_EFFICIENCY_STATUS_MESSAGES,
  type LiveGaugeResult,
} from '@repo/shared-domain/fuelLogSheet'
import {
  FUEL_LOG_MEMO_MAX_LENGTH,
  sanitizeFuelLogNumericInput,
  type FuelLogFormErrors,
  type FuelLogFormValues,
  type FuelLogNumericField,
} from './fuelLogForm'
import {
  formatEfficiency,
  formatKm,
  formatPricePerLiter,
} from './fuelLogFormat'
import { AppTextField } from '@/components/ui/AppTextField'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { FONTS, useAppTheme } from '@/theme'

type FuelLogFormFieldsProps = {
  values: FuelLogFormValues
  onChange: (values: FuelLogFormValues) => void
  errors: FuelLogFormErrors
  disabled?: boolean
  /**
   * 入力中の値から算出した目安（区間距離・燃費・単価）
   *
   * @remarks
   * 前回の給油記録を確認できたときだけ渡す。無ければ表示しない。
   */
  gauge?: LiveGaugeResult | null
}

/** 満タン・継ぎ足しの切り替え */
function FullTankToggle({
  isFullTank,
  onChange,
  disabled,
}: {
  isFullTank: boolean
  onChange: (isFullTank: boolean) => void
  disabled: boolean
}) {
  const { colors, spacing, radius, fontSizes, fontWeights } = useAppTheme()
  const options = [
    { label: '満タン', value: true },
    { label: '継ぎ足し', value: false },
  ] as const

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="満タン・継ぎ足しの切り替え"
      style={{
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: colors.cloudActive,
        borderRadius: radius.md,
        overflow: 'hidden',
      }}
    >
      {options.map((option) => {
        const selected = option.value === isFullTank
        return (
          <Pressable
            key={option.label}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing[2],
              backgroundColor: selected ? colors.product : 'transparent',
            }}
          >
            <Text
              style={{
                color: selected ? colors.productInk : colors.ink,
                fontSize: fontSizes.sm,
                fontWeight: selected ? fontWeights.bold : fontWeights.normal,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

/** 入力中の値から算出した目安の1マス */
function GaugeCell({ label, value }: { label: string; value: string }) {
  const { colors, fontSizes, spacing } = useAppTheme()
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: spacing[1] }}>
      <Text
        style={{
          color: colors.ink,
          fontFamily: FONTS.display,
          fontSize: fontSizes.lg,
        }}
      >
        {value}
      </Text>
      <Text style={{ color: colors.inkLight, fontSize: fontSizes.xs }}>
        {label}
      </Text>
    </View>
  )
}

/** 区間距離・燃費・単価の目安 */
function LiveGauge({ gauge }: { gauge: LiveGaugeResult }) {
  const { colors, spacing, radius, fontSizes } = useAppTheme()
  const note =
    gauge.efficiencyStatus === 'calculated'
      ? '保存すると、満タン法で燃費が確定します'
      : FUEL_EFFICIENCY_STATUS_MESSAGES[gauge.efficiencyStatus]

  return (
    <View
      testID="fuel-log-live-gauge"
      style={{
        gap: spacing[2],
        padding: spacing[3],
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.cloud,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <GaugeCell
          label="区間距離"
          value={gauge.intervalKm !== null ? formatKm(gauge.intervalKm) : '—'}
        />
        <GaugeCell
          label="燃費の目安"
          value={
            gauge.fuelEfficiency !== null
              ? formatEfficiency(gauge.fuelEfficiency)
              : '—'
          }
        />
        <GaugeCell
          label="単価"
          value={
            gauge.pricePerLiter !== null
              ? formatPricePerLiter(gauge.pricePerLiter)
              : '—'
          }
        />
      </View>
      <Text
        style={{
          color: colors.inkLight,
          fontSize: fontSizes.xs,
          textAlign: 'center',
        }}
      >
        {note}
      </Text>
    </View>
  )
}

/**
 * 給油の記録フォームの入力欄（登録と編集で共通）
 *
 * @remarks
 * 項目と文言は Web の給油記入票に揃えている（走行距離 ODO・給油量・支払金額・
 * 満タン／継ぎ足し・メモ）。
 */
export function FuelLogFormFields({
  values,
  onChange,
  errors,
  disabled = false,
  gauge,
}: FuelLogFormFieldsProps) {
  const { spacing } = useAppTheme()

  const setNumericField = (field: FuelLogNumericField, raw: string) => {
    onChange({ ...values, [field]: sanitizeFuelLogNumericInput(field, raw) })
  }

  return (
    <View style={{ gap: spacing[5] }}>
      <DateTimeField
        label="給油日時"
        value={values.refueledAt}
        onChange={(refueledAt) => onChange({ ...values, refueledAt })}
        maximumDate={new Date()}
        disabled={disabled}
      />
      <AppTextField
        label="走行距離 ODO"
        required
        unit="km"
        value={values.mileage}
        onChangeText={(raw) => setNumericField('mileage', raw)}
        error={errors.mileage}
        keyboardType="number-pad"
        placeholder="12345"
        editable={!disabled}
      />
      <AppTextField
        label="給油量"
        required
        unit="L"
        value={values.amount}
        onChangeText={(raw) => setNumericField('amount', raw)}
        error={errors.amount}
        keyboardType="decimal-pad"
        placeholder="8.50"
        editable={!disabled}
      />
      <AppTextField
        label="支払金額"
        required
        unit="円"
        value={values.totalPrice}
        onChangeText={(raw) => setNumericField('totalPrice', raw)}
        error={errors.totalPrice}
        keyboardType="number-pad"
        placeholder="1500"
        editable={!disabled}
      />
      <FullTankToggle
        isFullTank={values.isFullTank}
        onChange={(isFullTank) => onChange({ ...values, isFullTank })}
        disabled={disabled}
      />
      {gauge && <LiveGauge gauge={gauge} />}
      <AppTextField
        label="メモ"
        value={values.memo}
        onChangeText={(memo) => onChange({ ...values, memo })}
        error={errors.memo}
        placeholder="例: ハイオク満タン"
        multiline
        maxLength={FUEL_LOG_MEMO_MAX_LENGTH}
        style={{ minHeight: 72, textAlignVertical: 'top' }}
        editable={!disabled}
      />
    </View>
  )
}
