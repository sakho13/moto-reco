'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseTouringDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './page.module.css'
import { InfoBox } from '@/components/bike/InfoBox'
import { TouringLedgerSection } from '@/components/bike/TouringLedgerSection'
import { TouringListSection } from '@/components/touring/TouringListSection'
import { authenticatedFetch } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'

function TouringsPage() {
  const params = useParams()
  const router = useRouter()
  const bikeId = params.id as string
  const [keyword, setKeyword] = useState('')

  const {
    data: tourings,
    error,
    isLoading,
  } = useSWR(
    bikeId
      ? `/api/v1/user-bike/bike/${bikeId}/tourings?sort-by=start-date&sort-order=desc${
          keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''
        }`
      : null,
    async (url: string) => {
      const response = await authenticatedFetch(url, { method: 'GET' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new ApiV1Error(
          errorData.errorCode || 'SERVER_ERROR',
          errorData.message || 'エラーが発生しました'
        )
      }
      const json = (await response.json()) as SuccessResponse<
        ApiResponseTouringDetail[]
      >
      return json.data
    },
    { keepPreviousData: true }
  )

  // 表示順: STARTED → COMPLETED (開始日降順)
  const sortedTourings = tourings
    ? [...tourings].sort((a, b) => {
        const order = { STARTED: 0, COMPLETED: 1 }
        const statusDiff = order[a.status] - order[b.status]
        if (statusDiff !== 0) return statusDiff
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      })
    : []

  const handleDetail = (touringId: string) => {
    router.push(`/app/my-bike/${bikeId}/tourings/${touringId}`)
  }

  const handleRegisterHistory = () => {
    router.push(`/app/my-bike/${bikeId}/tourings/register?mode=history`)
  }

  if (isLoading && !tourings) {
    return (
      <div className={styles.fallback}>
        <div className={styles.loadingBox}>
          <p className={styles.loadingText}>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.fallback}>
        <div className={styles.errorActions}>
          <Button
            onClick={() => router.push(`/app/my-bike/${bikeId}`)}
            variant="cloud"
          >
            ← 戻る
          </Button>
        </div>

        <div className={styles.errorBox}>
          <h1 className={styles.errorTitle}>エラー</h1>
          <p className={styles.errorMessage}>
            {error instanceof ApiV1Error
              ? error.message
              : 'ツーリング履歴の取得に失敗しました'}
          </p>
          <Button onClick={() => router.push(`/app/my-bike/${bikeId}`)}>
            愛車に戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`${styles.topBar} flex flex-row flex-wrap gap-2`}>
        <Button
          onClick={() => router.push(`/app/my-bike/${bikeId}`)}
          variant="cloud"
        >
          ← 戻る
        </Button>
        <Button onClick={handleRegisterHistory} variant="primary">
          ツーリングを作成
        </Button>
        <Button
          onClick={() => router.push(`/app/my-bike/${bikeId}/touring-plans`)}
          variant="cloud"
        >
          プラン一覧
        </Button>
      </div>

      <InfoBox variant="info" className={`${styles.info} mt-3 text-sm`}>
        開始・終了地点の位置情報は本人のみ閲覧でき、他のユーザーには公開されません。
      </InfoBox>

      <div className={`${styles.listLayout} mt-3`}>
        <div className={styles.mobileOnly}>
          <TouringListSection
            tourings={sortedTourings}
            onDetail={handleDetail}
            onRegister={handleRegisterHistory}
            onSearch={setKeyword}
            isSearchActive={keyword.length > 0}
          />
        </div>

        <div className={styles.desktopOnly}>
          <TouringLedgerSection bikeId={bikeId} onSelect={handleDetail} />
        </div>
      </div>
    </>
  )
}

export default withAuth(TouringsPage)
