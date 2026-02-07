'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import type {
  ApiResponseTouringList,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { Select } from '@repo/ui/select'
import type { SelectOption } from '@repo/ui/select'
import { TouringListSection } from '@/components/touring/TouringListSection'
import { apiGet, authenticatedFetch } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { withAuth } from '@/lib/hoc/withAuth'

function TouringsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedFromQuery = searchParams.get('bikeId') ?? ''
  const [selectedBikeId, setSelectedBikeId] = useState<string>('')

  const {
    data: bikeList,
    error: bikeError,
    isLoading: isBikeLoading,
  } = useSWR('/api/v1/user-bike/bikes', async (url) => {
    const response = await apiGet(url)
    return response.data
  })

  useEffect(() => {
    if (!bikeList || bikeList.bikes.length === 0) {
      return
    }
    const hasBikeInQuery = bikeList.bikes.some(
      (bike) => bike.myUserBikeId === selectedFromQuery
    )
    if (selectedFromQuery && hasBikeInQuery) {
      setSelectedBikeId(selectedFromQuery)
      return
    }
    if (selectedBikeId === '' && bikeList.bikes[0]) {
      setSelectedBikeId(bikeList.bikes[0].myUserBikeId)
    }
  }, [bikeList, selectedBikeId, selectedFromQuery])

  const bikeOptions: SelectOption[] = useMemo(() => {
    if (!bikeList) {
      return []
    }
    return bikeList.bikes.map((bike) => {
      const label =
        bike.nickname ||
        `${bike.manufacturerName || ''} ${bike.modelName || '不明なバイク'}`.trim()
      return {
        value: bike.myUserBikeId,
        label,
      }
    })
  }, [bikeList])

  const {
    data: tourings,
    error: touringError,
    isLoading: isTouringLoading,
  } = useSWR(
    selectedBikeId
      ? `/api/v1/user-bike/bike/${selectedBikeId}/tourings?sort-by=end-date&sort-order=desc`
      : null,
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
        (await response.json()) as SuccessResponse<ApiResponseTouringList>
      return json.data
    }
  )

  const handleRegister = () => {
    if (!selectedBikeId) {
      return
    }
    router.push(`/app/tourings/register?bikeId=${selectedBikeId}`)
  }

  const handleDetail = (touringId: string) => {
    if (!selectedBikeId) {
      return
    }
    router.push(`/app/tourings/${touringId}?bikeId=${selectedBikeId}`)
  }

  const displayError = bikeError || touringError

  if (isBikeLoading || (selectedBikeId !== '' && isTouringLoading)) {
    return (
      <>
        <div className="w-full max-w-md mb-4">
          <Button onClick={() => router.push('/app/home')} variant="cloud">
            ← 戻る
          </Button>
        </div>
        <div className="w-full max-w-md flex items-center justify-center min-h-100">
          <p className="text-lg">読み込み中...</p>
        </div>
      </>
    )
  }

  if (displayError) {
    return (
      <>
        <div className="w-full max-w-md mb-4">
          <Button onClick={() => router.push('/app/home')} variant="cloud">
            ← 戻る
          </Button>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h1 className="text-2xl font-bold mb-4 text-red-600">エラー</h1>
            <p className="text-gray-700 mb-4">
              {displayError instanceof ApiV1Error
                ? displayError.message
                : 'ツーリング記録の取得に失敗しました'}
            </p>
            <Button onClick={() => router.push('/app/home')}>
              ホームに戻る
            </Button>
          </div>
        </div>
      </>
    )
  }

  if (!bikeList || bikeList.bikes.length === 0) {
    return (
      <>
        <div className="w-full max-w-md mb-4">
          <Button onClick={() => router.push('/app/home')} variant="cloud">
            ← 戻る
          </Button>
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4">ツーリング記録</h1>
          <p className="mb-4">
            ツーリング記録を登録するために、まずバイクを登録してください。
          </p>
          <Button onClick={() => router.push('/app/bike/register')}>
            バイクを登録する
          </Button>
        </div>
      </>
    )
  }

  const touringList = tourings ?? []

  return (
    <>
      <div className="w-full max-w-md">
        <Button onClick={() => router.push('/app/home')} variant="cloud">
          ← 戻る
        </Button>
      </div>

      <div className="flex flex-col gap-2 w-full max-w-md">
        <label htmlFor="bike-select" className="text-sm font-medium">
          表示するバイク
        </label>
        <Select
          id="bike-select"
          options={bikeOptions}
          value={selectedBikeId}
          onChange={(event) => setSelectedBikeId(event.target.value)}
        />
      </div>

      <TouringListSection
        tourings={touringList}
        onEdit={handleDetail}
        onRegister={handleRegister}
      />
    </>
  )
}

export default withAuth(TouringsPage)
