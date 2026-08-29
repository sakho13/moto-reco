'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import { Button } from '@repo/ui/button'
import { FuelLogRegisterModal } from './fuel-log/FuelLogRegisterModal'
import { BikeIcon } from './icons/BikeIcon'
import { FuelIcon } from './icons/FuelIcon'
import styles from './QuickFuelSection.module.css'
import { apiGet } from '@/lib/api/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { GUEST_ACCOUNT_LIMITS } from '@/lib/statics'

export const QuickFuelSection = () => {
  const router = useRouter()
  const { isGuest } = useAuth()
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null)

  const { data, error, isLoading } = useSWR(
    '/api/v1/user-bike/bikes',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )

  const bikes = data?.bikes ?? []

  // ゲストアカウントの給油上限チェック（バイク一覧レスポンスのカウントを利用）
  const isAtGuestFuelLimit =
    isGuest && (bikes[0]?.fuelLogCount ?? 0) >= GUEST_ACCOUNT_LIMITS.FUEL_LOG

  const handleBikeClick = (bikeId: string) => {
    if (isAtGuestFuelLimit) return
    setSelectedBikeId(bikeId)
  }

  if (error) {
    const isUserNotRegisteredError =
      error instanceof ApiV1Error && error.errorCode === 'USER_NOT_REGISTERED'

    return (
      <div className={styles.container} data-testid="fuel-section">
        <div className={styles.header}>
          <h2 className={styles.title}>給油を登録する</h2>
        </div>
        <div className={styles.errorContainer}>
          {isUserNotRegisteredError ? (
            <>
              <p className={styles.errorMessage}>
                ユーザー登録の反映を確認しています。数秒後に再読み込みしてください。
              </p>
              <Button
                onClick={() => router.refresh()}
                size="sm"
                variant="cloud"
              >
                再読み込み
              </Button>
            </>
          ) : (
            <p className={styles.errorMessage}>
              {error instanceof ApiV1Error
                ? error.message
                : 'バイク情報の取得に失敗しました'}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.container} data-testid="fuel-section">
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
      <div className={styles.container} data-testid="fuel-section">
        <div className={styles.header}>
          <h2 className={styles.title}>給油を登録する</h2>
        </div>
        <div className={styles.emptyState}>
          <p>バイクを登録してください</p>
          <Button onClick={() => router.push('/app/bike/register')} size="sm">
            バイクを登録
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {selectedBikeId && (
        <FuelLogRegisterModal
          bikeId={selectedBikeId}
          onClose={() => setSelectedBikeId(null)}
          onSuccess={() => setSelectedBikeId(null)}
        />
      )}

      <div className={styles.container} data-testid="fuel-section">
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <FuelIcon />
            <h2 className={styles.title}>給油を登録する</h2>
          </div>
        </div>

        {isAtGuestFuelLimit && (
          <p className={styles.guestLimitMessage}>
            ゲストアカウントは給油履歴を{GUEST_ACCOUNT_LIMITS.FUEL_LOG}
            件まで登録できます。
          </p>
        )}

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
                  className={`${styles.bikeCard} ${isAtGuestFuelLimit ? styles.bikeCardDisabled : ''}`}
                  aria-label={`${title}の給油を登録`}
                  disabled={isAtGuestFuelLimit}
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
    </>
  )
}
