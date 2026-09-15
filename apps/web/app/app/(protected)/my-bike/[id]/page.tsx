'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import useSWR from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import type {
  ApiResponseUserBikeDetail,
  SuccessResponse,
} from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import styles from './page.module.css'
import { BikeGauges } from '@/components/bike/BikeGauges'
import { BikeHeroSection } from '@/components/bike/BikeHeroSection'
import { BikePrimaryAction } from '@/components/bike/BikePrimaryAction'
import { BikeRecordLinks } from '@/components/bike/BikeRecordLinks'
import { MaintenanceScheduleSection } from '@/components/bike/MaintenanceScheduleSection'
import { BikePhotosCard } from '@/components/photo/BikePhotosCard'
import { apiGet, authenticatedFetch } from '@/lib/api/client'
import { withAuth } from '@/lib/hoc/withAuth'
import { useActiveBike } from '@/lib/hooks/useActiveBike'
import { useAuth } from '@/lib/hooks/useAuth'

/**
 * 愛車の詳細（カルテ）
 *
 * @remarks
 * 一覧を挟まずアクティブ車両の詳細を直接開く構成（Issue #575）の詳細ページ本体。
 * 見出し・諸元 → 計器 → 点検の予定 → 主アクション → 記録へのリンクの順に構成する
 * （画面案の並び順は、モバイルモック「愛車」の視覚的な流れ：ヒーロー→CTA→行リスト
 * を優先し、CTAを記録へのリンクより先に置いている）。
 */
function BikeDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { isGuest } = useAuth()
  const { setActiveBikeId } = useActiveBike()

  const { data: profile } = useSWR('/api/v1/user/profile', async (url) => {
    const response = await apiGet(url)
    return response.data
  })
  const isAdmin = profile?.role === 'ADMIN'

  const { data, error, isLoading } = useSWR(
    id ? `/api/v1/user-bike/bike/${id}` : null,
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
        (await response.json()) as SuccessResponse<ApiResponseUserBikeDetail>
      return json.data
    }
  )

  // このバイクの詳細を開いたら、アクティブ車両をこのバイクに同期する
  // （ヘッダーのBikeSwitcher・ホームなどアプリ全体が参照する）
  useEffect(() => {
    if (data) {
      setActiveBikeId(id)
    }
  }, [data, id, setActiveBikeId])

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.centerMessage}>読み込み中...</p>
      </div>
    )
  }

  if (error) {
    const isNotFound =
      error instanceof ApiV1Error && error.errorCode === 'NOT_FOUND'

    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <h1 className={styles.errorTitle}>
            {isNotFound ? 'バイクが見つかりません' : 'エラー'}
          </h1>
          <p className={styles.errorMessage}>
            {isNotFound
              ? '指定されたバイクは存在しないか、削除されています。'
              : error instanceof ApiV1Error
                ? error.message
                : 'バイク情報の取得に失敗しました'}
          </p>
          <Button onClick={() => (window.location.href = '/app/home')}>
            ホームに戻る
          </Button>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const bike = data

  return (
    <div className={styles.page}>
      <BikeHeroSection bike={bike} />

      <BikeGauges bikeId={id} totalMileage={bike.totalMileage} />

      <MaintenanceScheduleSection bikeId={id} />

      <BikePrimaryAction
        bikeId={id}
        fuelLogCount={bike.fuelLogCount}
        isGuest={isGuest}
      />

      <BikeRecordLinks
        bikeId={id}
        fuelLogCount={bike.fuelLogCount}
        touringCount={bike.touringCount}
        isAdmin={isAdmin}
      />

      {isAdmin && <BikePhotosCard myUserBikeId={id} />}
    </div>
  )
}

export default withAuth(BikeDetailPage)
