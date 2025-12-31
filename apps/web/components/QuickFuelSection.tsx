'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@repo/ui/button'
import { BikeIcon } from './icons/BikeIcon'
import { FuelIcon } from './icons/FuelIcon'
import styles from './QuickFuelSection.module.css'
import { apiGet } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

export const QuickFuelSection = () => {
  const router = useRouter()

  const { data, error, isLoading } = useSWR(
    '/api/v1/user-bike/bikes',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )

  const bikes = data?.bikes ?? []

  const handleBikeClick = (bikeId: string) => {
    router.push(`/my-bike/${bikeId}/fuel-logs/register`)
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>給油を登録する</h2>
        </div>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>
            {error instanceof ApiV1Error
              ? error.message
              : 'バイク情報の取得に失敗しました'}
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>給油を登録する</h2>
        </div>
        <div className={styles.loadingContainer}>
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (bikes.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>給油を登録する</h2>
        </div>
        <div className={styles.emptyState}>
          <p>バイクを登録してください</p>
          <Button onClick={() => router.push('/bike/register')} size="sm">
            バイクを登録
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <FuelIcon />
          <h2 className={styles.title}>給油を登録する</h2>
        </div>
      </div>

      <div className={styles.bikeSelectionSection}>
        <div className={styles.bikeGrid}>
          {bikes.map((bike) => {
            const title =
              bike.nickname ||
              `${bike.manufacturerName || ''} ${bike.modelName || '不明なバイク'}`.trim()

            return (
              <button
                key={bike.myUserBikeId}
                type="button"
                onClick={() => handleBikeClick(bike.myUserBikeId)}
                className={styles.bikeCard}
                aria-label={`${title}の給油を登録`}
              >
                <div className={styles.bikeIconContainer}>
                  <BikeIcon />
                </div>
                <div className={styles.bikeTextContainer}>
                  <h4 className={styles.bikeTitle}>{title}</h4>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
