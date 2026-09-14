'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { mutate } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import { getCurrentDate } from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import { BikeIcon } from './icons/BikeIcon'
import { TouringIcon } from './icons/TouringIcon'
import styles from './TouringStartEndSection.module.css'
import { trackEvent } from '@/lib/analytics'
import { apiPost } from '@/lib/api/client'
import { getBikeDisplayName } from '@/lib/bike'
import { useActiveBike } from '@/lib/hooks/useActiveBike'
import { useAuth } from '@/lib/hooks/useAuth'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { GUEST_ACCOUNT_LIMITS } from '@/lib/statics'

export const TouringStartEndSection = () => {
  const router = useRouter()
  const { isGuest } = useAuth()
  const { activeBike, bikes, isLoading, error } = useActiveBike()
  const [isStarting, setIsStarting] = useState(false)
  const { getCurrentPosition } = useGeolocation()
  const [isMileageModalOpen, setIsMileageModalOpen] = useState(false)
  const [startMileageInput, setStartMileageInput] = useState('')

  // ゲストアカウントのツーリング上限チェック（バイク一覧レスポンスのカウントを利用）
  const isAtGuestTouringLimit =
    isGuest && (activeBike?.touringCount ?? 0) >= GUEST_ACCOUNT_LIMITS.TOURING

  const handleStartTouring = async (startMileage?: number) => {
    if (!activeBike) return
    const myUserBikeId = activeBike.myUserBikeId
    const bikeName = getBikeDisplayName(activeBike)

    setIsStarting(true)
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
      trackEvent('touring_start', {
        from_touring_plan: false,
        has_position: position != null,
        has_start_mileage: startMileage !== undefined,
      })

      toast.success('ツーリングを開始しました')
      // SWR再検証
      await mutate('/api/v1/user-bike/bikes/ongoing-tourings').catch(() => {})
    } catch (err) {
      trackEvent('touring_error', {
        operation: 'start',
        ...(err instanceof ApiV1Error
          ? { error_code: err.errorCode, error_message: err.message }
          : {}),
      })
      if (err instanceof ApiV1Error) {
        toast.error(err.message)
      } else {
        toast.error('ツーリングの開始に失敗しました')
      }
    } finally {
      setIsStarting(false)
    }
  }

  const handleOpenMileageModal = () => {
    if (!activeBike) return
    setStartMileageInput(String(activeBike.totalMileage))
    setIsMileageModalOpen(true)
  }

  const handleConfirmStart = async () => {
    const parsed = parseInt(startMileageInput, 10)
    const mileage =
      startMileageInput !== '' && !isNaN(parsed) ? parsed : undefined
    setIsMileageModalOpen(false)
    await handleStartTouring(mileage)
  }

  if (error) {
    const isUserNotRegisteredError =
      error instanceof ApiV1Error && error.errorCode === 'USER_NOT_REGISTERED'

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

  if (bikes.length === 0 || !activeBike) {
    return (
      <div className={styles.container} data-testid="touring-section">
        <div className={styles.header}>
          <h2 className={styles.title}>ツーリング</h2>
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

  const bikeName = getBikeDisplayName(activeBike)

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
        <div className={styles.compactBikeCard}>
          <div className={styles.compactBikeHeader}>
            <div className={styles.compactBikeIcon}>
              <BikeIcon />
            </div>
            <h4 className={styles.compactBikeName}>{bikeName}</h4>
          </div>

          <Button
            onClick={handleOpenMileageModal}
            disabled={isStarting || isAtGuestTouringLimit}
            variant="primary"
            size="sm"
            className={styles.startButton}
          >
            {isStarting ? '開始中...' : '開始'}
          </Button>
        </div>
      </div>

      {/* 開始時 走行距離入力モーダル */}
      {isMileageModalOpen && (
        <div
          className={styles.spotModalOverlay}
          onClick={() => setIsMileageModalOpen(false)}
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
                onClick={() => setIsMileageModalOpen(false)}
                variant="cloud"
                size="md"
                disabled={isStarting}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleConfirmStart}
                variant="primary"
                size="md"
                disabled={isStarting}
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
