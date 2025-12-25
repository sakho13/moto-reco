'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Button } from '@packages/ui/button'
import { FuelIcon } from './icons/FuelIcon'
import styles from './QuickFuelSection.module.css'
import { apiGet } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'

export const QuickFuelSection = () => {
  const router = useRouter()
  const [selectedBikeId, setSelectedBikeId] = useState<string | undefined>()

  const { data, error, isLoading } = useSWR(
    '/api/v1/user-bike/bikes',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )

  // 更新日時の降順でソート
  const sortedBikes = useMemo(
    () =>
      data?.bikes.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ) ?? [],
    [data?.bikes]
  )

  // 初期値設定: 最新のバイクを自動選択
  useEffect(() => {
    if (sortedBikes.length > 0 && !selectedBikeId) {
      const firstBike = sortedBikes[0]
      if (firstBike) {
        setSelectedBikeId(firstBike.myUserBikeId)
      }
    }
  }, [sortedBikes, selectedBikeId])

  const handleNavigate = () => {
    if (selectedBikeId) {
      router.push(`/my-bike/${selectedBikeId}/fuel-logs/register`)
    }
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

  if (sortedBikes.length === 0) {
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
      <div className={styles.selectContainer}>
        <label htmlFor="bike-select" className={styles.label}>
          バイクを選択
        </label>
        <select
          id="bike-select"
          value={selectedBikeId}
          onChange={(e) => setSelectedBikeId(e.target.value)}
          className={styles.select}
        >
          {sortedBikes.map((bike) => {
            const title =
              bike.nickname ||
              `${bike.manufacturerName || ''} ${bike.modelName || '不明なバイク'}`.trim()
            return (
              <option key={bike.myUserBikeId} value={bike.myUserBikeId}>
                {title}
              </option>
            )
          })}
        </select>
      </div>
      <div className={styles.buttonContainer}>
        <Button
          onClick={handleNavigate}
          variant="primary"
          fullWidth
          disabled={!selectedBikeId}
        >
          給油を登録
        </Button>
      </div>
    </div>
  )
}
