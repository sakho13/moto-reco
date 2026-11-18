import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { Platform, Pressable, Text, View } from 'react-native'
import { formatDateTime } from '@repo/shared-utils'
import { FONTS, useAppTheme } from '@/theme'

type DateTimeFieldProps = {
  /** 入力欄の見出し */
  label: string
  value: Date
  onChange: (value: Date) => void
  /** 選べる最も新しい日時（未来の日時を選ばせない場合に指定） */
  maximumDate?: Date
  disabled?: boolean
}

/** 日付だけを入れ替える（時刻はそのまま） */
function withDate(base: Date, date: Date): Date {
  const next = new Date(base)
  next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
  return next
}

/** 時刻だけを入れ替える（日付はそのまま） */
function withTime(base: Date, time: Date): Date {
  const next = new Date(base)
  next.setHours(time.getHours(), time.getMinutes(), 0, 0)
  return next
}

/**
 * 日時の入力欄
 *
 * @remarks
 * iOS は端末標準のコンパクトな日時選択をそのまま置く。Android は日時を
 * 一度に選べないため、日付 → 時刻の順にダイアログを出す。
 */
export function DateTimeField({
  label,
  value,
  onChange,
  maximumDate,
  disabled = false,
}: DateTimeFieldProps) {
  const { colors, spacing, fontSizes, radius, fontWeights } = useAppTheme()

  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      maximumDate,
      onChange: (dateEvent: DateTimePickerEvent, date?: Date) => {
        if (dateEvent.type !== 'set' || !date) return
        const pickedDate = withDate(value, date)
        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent: DateTimePickerEvent, time?: Date) => {
            onChange(
              timeEvent.type === 'set' && time
                ? withTime(pickedDate, time)
                : pickedDate
            )
          },
        })
      },
    })
  }

  return (
    <View style={{ gap: spacing[1] }}>
      <Text
        style={{
          color: colors.ink,
          fontFamily: FONTS.body,
          fontSize: fontSizes.sm,
          fontWeight: fontWeights.medium,
        }}
      >
        {label}
      </Text>
      {Platform.OS === 'ios' ? (
        <View style={{ alignItems: 'flex-start' }}>
          <DateTimePicker
            accessibilityLabel={label}
            value={value}
            mode="datetime"
            display="compact"
            locale="ja-JP"
            maximumDate={maximumDate}
            disabled={disabled}
            accentColor={colors.product}
            onChange={(_event: DateTimePickerEvent, date?: Date) => {
              if (date) onChange(date)
            }}
          />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}を変更`}
          disabled={disabled}
          onPress={openAndroidPicker}
          style={{
            minHeight: 48,
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: colors.cloudActive,
            borderRadius: radius.md,
            paddingHorizontal: spacing[3],
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <Text style={{ color: colors.ink, fontSize: fontSizes.md }}>
            {formatDateTime(value)}
          </Text>
        </Pressable>
      )}
    </View>
  )
}
