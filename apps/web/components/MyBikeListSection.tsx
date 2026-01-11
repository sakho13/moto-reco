'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@repo/ui/button'
import { BikeIcon } from './icons/BikeIcon'
import styles from './MyBikeListSection.module.css'
import { NavigationCard } from './NavigationCard'
import { apiGet } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

export const MyBikeListSection = () => {
  const router = useRouter()

  const { data, error, isLoading } = useSWR(
    '/api/v1/user-bike/bikes',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )

  const bikes = data?.bikes ?? []

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>マイバイク</h2>
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
          <h2 className={styles.title}>マイバイク</h2>
        </div>
        <div className={styles.loadingContainer}>
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>マイバイク</h2>
      </div>

      {bikes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>まだバイクが登録されていません</p>

          <Button onClick={() => router.push('/app/bike/register')} size="sm">
            最初のバイクを登録
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {bikes.map((bike) => {
            const title =
              bike.nickname ||
              `${bike.manufacturerName || ''} ${bike.modelName || '不明なバイク'}`.trim()
            const description = `${bike.displacement}cc${bike.modelYear ? ` | ${bike.modelYear}年式` : ''}`

            return (
              <NavigationCard
                key={bike.myUserBikeId}
                href={`/app/my-bike/${bike.myUserBikeId}`}
                title={title}
                description={description}
                icon={<BikeIcon />}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
