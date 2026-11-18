import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Text } from 'react-native'
import useSWR from 'swr'
import {
  calculateLiveGauges,
  parseFieldNumber,
} from '@repo/shared-domain/fuelLogSheet'
import { getBikeDisplayName } from '@repo/shared-utils'
import { AppButton } from '@/components/ui/AppButton'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { FormScreen } from '@/components/ui/FormScreen'
import { MessageView } from '@/components/ui/MessageView'
import { useActiveBike } from '@/features/bike/useActiveBike'
import {
  fetchPreviousFuelLog,
  registerFuelLog,
} from '@/features/fuelLog/fuelLogApi'
import {
  buildFuelLogRegisterRequest,
  createEmptyFuelLogForm,
  validateFuelLogForm,
  type FuelLogFormErrors,
} from '@/features/fuelLog/fuelLogForm'
import { FuelLogFormFields } from '@/features/fuelLog/FuelLogFormFields'
import { useRevalidateFuelLogs } from '@/features/fuelLog/useFuelLogs'
import { getErrorMessage } from '@/lib/errorMessage'
import { useAppTheme } from '@/theme'

/**
 * 給油の記録画面
 *
 * @remarks
 * Web の給油記入票と同じく、選んだ給油日時以前で最も新しい給油記録を問い合わせ、
 * 区間距離・燃費・単価の目安を出す。保存時にも同じ問い合わせで前回走行距離を補完する。
 */
export default function NewFuelLogScreen() {
  const router = useRouter()
  const { colors, fontSizes } = useAppTheme()
  const { activeBike, refreshBikes } = useActiveBike()
  const revalidateFuelLogs = useRevalidateFuelLogs()
  const [values, setValues] = useState(() => createEmptyFuelLogForm())
  const [errors, setErrors] = useState<FuelLogFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const bikeId = activeBike?.myUserBikeId ?? null
  const { data: previousLog, error: previousLogError } = useSWR(
    bikeId
      ? ['previous-fuel-log', bikeId, values.refueledAt.toISOString()]
      : null,
    ([, id, refueledAt]) => fetchPreviousFuelLog(id, new Date(refueledAt)),
    { keepPreviousData: true }
  )

  if (!activeBike) {
    return (
      <MessageView
        title="愛車が登録されていません"
        description="給油を記録するには、先に Web 版で愛車を登録してください。"
      />
    )
  }

  const gauge =
    previousLog !== undefined && !previousLogError
      ? calculateLiveGauges({
          mileage: parseFieldNumber(values.mileage),
          amount: parseFieldNumber(values.amount),
          totalPrice: parseFieldNumber(values.totalPrice),
          isFullTank: values.isFullTank,
          previousLog,
        })
      : null

  const handleSubmit = async () => {
    setFormError(null)
    const result = validateFuelLogForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    setSubmitting(true)
    try {
      // 表示中の目安とは別に、保存の直前にも問い合わせ直す（選んだ日時に確実に合わせるため）
      const resolvedPreviousLog = await fetchPreviousFuelLog(
        activeBike.myUserBikeId,
        result.parsed.refueledAt
      )
      await registerFuelLog(
        activeBike.myUserBikeId,
        buildFuelLogRegisterRequest({
          parsed: result.parsed,
          resolvedPreviousLog,
          totalMileage: activeBike.totalMileage,
        })
      )
      await Promise.all([
        revalidateFuelLogs(activeBike.myUserBikeId),
        refreshBikes(),
      ])
      router.back()
    } catch (error: unknown) {
      setFormError(
        getErrorMessage(
          error,
          '給油の記録に失敗しました。もう一度お試しください。'
        )
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormScreen>
      <Text style={{ color: colors.inkLight, fontSize: fontSizes.sm }}>
        {getBikeDisplayName(activeBike)} の給油を記録します
      </Text>
      {formError && <ErrorBanner message={formError} />}
      <FuelLogFormFields
        values={values}
        onChange={setValues}
        errors={errors}
        disabled={submitting}
        gauge={gauge}
      />
      <AppButton label="記録する" loading={submitting} onPress={handleSubmit} />
    </FormScreen>
  )
}
