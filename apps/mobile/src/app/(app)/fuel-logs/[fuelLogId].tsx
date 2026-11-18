import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert } from 'react-native'
import useSWR from 'swr'
import type { ApiResponseFuelLogDetail } from '@repo/shared-types'
import { AppButton } from '@/components/ui/AppButton'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { FormScreen } from '@/components/ui/FormScreen'
import { LoadingView } from '@/components/ui/LoadingView'
import { MessageView } from '@/components/ui/MessageView'
import { useActiveBike } from '@/features/bike/useActiveBike'
import {
  deleteFuelLog,
  fetchFuelLogDetail,
  getFuelLogDetailPath,
  updateFuelLog,
} from '@/features/fuelLog/fuelLogApi'
import {
  buildFuelLogUpdateRequest,
  toFuelLogFormValues,
  validateFuelLogForm,
  type FuelLogFormErrors,
} from '@/features/fuelLog/fuelLogForm'
import { FuelLogFormFields } from '@/features/fuelLog/FuelLogFormFields'
import { useRevalidateFuelLogs } from '@/features/fuelLog/useFuelLogs'
import { getErrorMessage } from '@/lib/errorMessage'

type FuelLogEditFormProps = {
  myUserBikeId: string
  fuelLog: ApiResponseFuelLogDetail
}

/**
 * 保存済みの給油記録の編集フォーム
 *
 * @remarks
 * 読み込んだ記録を初期値にするため、読み込みが終わってから表示する。
 */
function FuelLogEditForm({ myUserBikeId, fuelLog }: FuelLogEditFormProps) {
  const router = useRouter()
  const { refreshBikes } = useActiveBike()
  const revalidateFuelLogs = useRevalidateFuelLogs()
  const [values, setValues] = useState(() => toFuelLogFormValues(fuelLog))
  const [errors, setErrors] = useState<FuelLogFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<
    'update' | 'delete' | null
  >(null)

  /** 保存・削除の後に一覧へ戻る */
  const finish = async () => {
    await Promise.all([revalidateFuelLogs(myUserBikeId), refreshBikes()])
    router.back()
  }

  const handleUpdate = async () => {
    setFormError(null)
    const result = validateFuelLogForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    setPendingAction('update')
    try {
      await updateFuelLog(
        myUserBikeId,
        buildFuelLogUpdateRequest({
          fuelLogId: fuelLog.fuelLogId,
          parsed: result.parsed,
          previousMileage: fuelLog.previousMileage,
        })
      )
      await finish()
    } catch (error: unknown) {
      setFormError(getErrorMessage(error, '給油の記録を更新できませんでした。'))
    } finally {
      setPendingAction(null)
    }
  }

  const runDelete = async () => {
    setFormError(null)
    setPendingAction('delete')
    try {
      await deleteFuelLog(myUserBikeId, fuelLog.fuelLogId)
      await finish()
    } catch (error: unknown) {
      setFormError(getErrorMessage(error, '給油の記録を削除できませんでした。'))
    } finally {
      setPendingAction(null)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      '給油の記録を削除',
      'この給油の記録を削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => void runDelete(),
        },
      ]
    )
  }

  return (
    <FormScreen>
      {formError && <ErrorBanner message={formError} />}
      <FuelLogFormFields
        values={values}
        onChange={setValues}
        errors={errors}
        disabled={pendingAction !== null}
      />
      <AppButton
        label="保存する"
        loading={pendingAction === 'update'}
        disabled={pendingAction !== null}
        onPress={handleUpdate}
      />
      <AppButton
        label="削除する"
        variant="danger"
        loading={pendingAction === 'delete'}
        disabled={pendingAction !== null}
        onPress={handleDelete}
      />
    </FormScreen>
  )
}

/**
 * 給油の記録の編集・削除画面
 */
export default function FuelLogDetailScreen() {
  const { fuelLogId } = useLocalSearchParams<{ fuelLogId: string }>()
  const { activeBike } = useActiveBike()
  const bikeId = activeBike?.myUserBikeId ?? null
  const { data, error, isLoading, mutate } = useSWR(
    bikeId && fuelLogId ? getFuelLogDetailPath(bikeId, fuelLogId) : null,
    fetchFuelLogDetail
  )

  if (!bikeId || isLoading) {
    return <LoadingView />
  }

  if (error || !data) {
    return (
      <MessageView
        title="給油の記録を読み込めませんでした"
        description={getErrorMessage(
          error,
          'しばらくしてからもう一度お試しください。'
        )}
      >
        <AppButton
          label="もう一度読み込む"
          variant="secondary"
          onPress={() => void mutate()}
        />
      </MessageView>
    )
  }

  return <FuelLogEditForm myUserBikeId={bikeId} fuelLog={data} />
}
