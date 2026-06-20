'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import { BikeIcon } from './icons/BikeIcon'
import { TouringIcon } from './icons/TouringIcon'
import styles from './TouringStartEndSection.module.css'
import { apiGet, apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { useAuth } from '@/lib/hooks/useAuth'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { GUEST_ACCOUNT_LIMITS } from '@/lib/statics'
import { getCurrentDate } from '@repo/shared-utils'

type BikeWithTouring = {
  myUserBikeId: string
  bikeName: string
  totalMileage: number
}

export const TouringStartEndSection = () => {
  const router = useRouter()
  const { isGuest } = useAuth()
  const [loadingBikeId, setLoadingBikeId] = useState<string | null>(null)
  const { getCurrentPosition } = useGeolocation()
  const [pendingStartBike, setPendingStartBike] = useState<{
    myUserBikeId: string
    bikeName: string
    totalMileage: number
  } | null>(null)
  const [startMileageInput, setStartMileageInput] = useState('')

  // バイク一覧取得
  const {
    data: bikesData,
    error: bikesError,
    isLoading: bikesLoading,
  } = useSWR('/api/v1/user-bike/bikes', async (url) => {
    const response = await apiGet(url)
    return response.data
  })

  const bikes = bikesData?.bikes ?? []

  // ゲストアカウントのツーリング上限チェック（バイク一覧レスポンスのカウントを利用）
  const isAtGuestTouringLimit =
    isGuest && (bikes[0]?.touringCount ?? 0) >= GUEST_ACCOUNT_LIMITS.TOURING

  // バイク情報を整形
  const bikesWithTouring: BikeWithTouring[] = bikes.map((bike) => {
    const bikeName =
      bike.nickname ||
      `${bike.manufacturerName || ''} ${bike.modelName || '不明なバイク'}`.trim()

    return {
      myUserBikeId: bike.myUserBikeId,
      bikeName,
      totalMileage: bike.totalMileage,
    }
  })

  const handleStartTouring = async (
    myUserBikeId: string,
    bikeName: string,
    startMileage?: number
  ) => {
    setLoadingBikeId(myUserBikeId)
    try {
      const now = getCurrentDate()
      const defaultTitle = `${bikeName} ${now.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
      })}のツーリング`

      const { position } = await getCurrentPosition()

      await apiPost(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end` as const,
        {
          action: 'start',
          title: defaultTitle,
          startDate: now.toISOString(),
          startLatitude: position?.latitude,
          startLongitude: position?.longitude,
          startMileage,
        }
      )

      toast.success('ツーリングを開始しました')
      // SWR再検証
      await mutate('/api/v1/user-bike/bikes/ongoing-tourings')
    } catch (error) {
      if (error instanceof ApiV1Error) {
        toast.error(error.message)
      } else {
        toast.error('ツーリングの開始に失敗しました')
      }
    } finally {
      setLoadingBikeId(null)
    }
  }

  const handleOpenStartModal = (
    myUserBikeId: string,
    bikeName: string,
    totalMileage: number
  ) => {
    setPendingStartBike({ myUserBikeId, bikeName, totalMileage })
    setStartMileageInput(String(totalMileage))
  }

  const handleConfirmStart = async () => {
    if (!pendingStartBike) return
    const parsed = parseInt(startMileageInput, 10)
    const mileage =
      startMileageInput !== '' && !isNaN(parsed) ? parsed : undefined
    setPendingStartBike(null)
    await handleStartTouring(
      pendingStartBike.myUserBikeId,
      pendingStartBike.bikeName,
      mileage
    )
  }

  if (bikesError) {
    const isUserNotRegisteredError =
      bikesError instanceof ApiV1Error &&
      bikesError.errorCode === 'USER_NOT_REGISTERED'

    return (
      <div className={styles.container} data-testid="touring-section">
        <div className={styles.header}>
          <h2 className={styles.title}>ツーリング</h2>
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
              {bikesError instanceof ApiV1Error
                ? bikesError.message
                : 'バイク情報の取得に失敗しました'}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (bikesLoading) {
    return (
      <div className={styles.container} data-testid="touring-section">
        <div className={styles.header}>
          <h2 className={styles.title}>ツーリング</h2>
        </div>
        <div className={styles.loadingContainer}>
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (bikes.length === 0) {
    return null
  }

  // バイク選択グリッド
  return (
    <div className={styles.container} data-testid="touring-section">
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <TouringIcon />
          <h2 className={styles.title}>今すぐツーリング</h2>
        </div>
      </div>

      {isAtGuestTouringLimit && (
        <p className={styles.guestLimitMessage}>
          ゲストアカウントはツーリングを{GUEST_ACCOUNT_LIMITS.TOURING}
          件まで登録できます。
        </p>
      )}

      <div className={styles.bikeSelectionGrid}>
        {bikesWithTouring.map((bike) => {
          const isLoading = loadingBikeId === bike.myUserBikeId

          return (
            <div key={bike.myUserBikeId} className={styles.compactBikeCard}>
              <div className={styles.compactBikeHeader}>
                <div className={styles.compactBikeIcon}>
                  <BikeIcon />
                </div>
                <h4 className={styles.compactBikeName}>{bike.bikeName}</h4>
              </div>

              <Button
                onClick={() =>
                  handleOpenStartModal(
                    bike.myUserBikeId,
                    bike.bikeName,
                    bike.totalMileage
                  )
                }
                disabled={isLoading || isAtGuestTouringLimit}
                variant="primary"
                size="sm"
                className={styles.startButton}
              >
                {isLoading ? '開始中...' : '開始'}
              </Button>
            </div>
          )
        })}
      </div>

      {/* 開始時 走行距離入力モーダル */}
      {pendingStartBike && (
        <div
          className={styles.spotModalOverlay}
          onClick={() => setPendingStartBike(null)}
        >
          <div
            className={styles.spotModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.spotModalTitle}>出発時の走行距離</h3>

            <div className={styles.spotModalField}>
              <label className={styles.spotModalLabel}>
                現在の走行距離（km）
              </label>
              <input
                type="number"
                inputMode="numeric"
                className={styles.spotModalInput}
                placeholder="例：12345"
                value={startMileageInput}
                onChange={(e) => setStartMileageInput(e.target.value)}
                min={0}
                step={1}
              />
            </div>

            <div className={styles.spotModalActions}>
              <Button
                onClick={() => setPendingStartBike(null)}
                variant="cloud"
                size="md"
                disabled={loadingBikeId !== null}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleConfirmStart}
                variant="primary"
                size="md"
                disabled={loadingBikeId !== null}
              >
                開始する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
