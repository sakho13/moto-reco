'use client'

import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import type {
  ApiResponseFuelLogList,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { FuelLogListSection } from '@/components/fuel-log/FuelLogListSection'
import { authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function FuelLogsPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string

  const { data, error, isLoading } = useSWR(
    bikeId ? `/api/v1/user-bike/bike/${bikeId}/fuel-logs` : null,
    async (url) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || 'エラーが発生しました'
        )
      }
      const json =
        (await response.json()) as SuccessResponse<ApiResponseFuelLogList>
      return json.data
    }
  )

  const handleEdit = (fuelLogId: string) => {
    router.push(`/app/my-bike/${bikeId}/fuel-logs/${fuelLogId}/edit`)
  }

  const handleRegister = () => {
    router.push(`/app/my-bike/${bikeId}/fuel-logs/register`)
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center min-h-100">
          <p className="text-lg">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}`)}
            variant="cloud"
          >
            ← 戻る
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
          <p className="text-gray-700 mb-4">
            {error instanceof ApiV1Error
              ? error.message
              : '給油履歴の取得に失敗しました'}
          </p>
          <Button onClick={() => router.push(`/app/my-bike/${bikeId}`)}>
            バイク詳細に戻る
          </Button>
        </div>
      </div>
    )
  }

  const fuelLogs = data || []
  const sortedFuelLogs = [...fuelLogs].sort(
    (a, b) =>
      new Date(b.refueledAt).getTime() - new Date(a.refueledAt).getTime()
  )

  return (
    <>
      <div className="w-full max-w-md flex flex-row gap-2">
        <Button
          onClick={() => router.push(`/app/my-bike/${bikeId}`)}
          variant="cloud"
        >
          ← 戻る
        </Button>

        <Button onClick={handleRegister} variant="primary">
          給油履歴を登録
        </Button>
      </div>

      <FuelLogListSection
        fuelLogs={sortedFuelLogs}
        onEdit={handleEdit}
        onRegister={handleRegister}
      />
    </>
  )
}

export default withAuth(FuelLogsPage)
