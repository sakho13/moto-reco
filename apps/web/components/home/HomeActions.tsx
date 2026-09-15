'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { mutate } from 'swr'
import { ApiV1Error } from '@repo/shared-domain'
import { getCurrentDate } from '@repo/shared-utils'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import styles from './HomeActions.module.css'
import { FuelLogRegisterModal } from '@/components/fuel-log/FuelLogRegisterModal'
import { FuelIcon } from '@/components/icons/FuelIcon'
import { TouringIcon } from '@/components/icons/TouringIcon'
import { trackEvent } from '@/lib/analytics'
import { apiPost } from '@/lib/api/client'
import { getBikeDisplayName } from '@/lib/bike'
import { useActiveBike } from '@/lib/hooks/useActiveBike'
import { useAuth } from '@/lib/hooks/useAuth'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { GUEST_ACCOUNT_LIMITS } from '@/lib/statics'

/**
 * ホームの主アクション（給油を記録・ツーリングを開始）
 *
 * @remarks
 * 「1画面に主アクションは1つ」という設計原則（Issue #575）に基づき、
 * 給油を主アクション（大きいボタン）、ツーリングを副次アクション（枠線ボタン）にする。
 * 対象車両はヘッダーのアクティブ車両（`useActiveBike`）に統一されている。
 */
export function HomeActions() {
  const router = useRouter()
  const { isGuest } = useAuth()
  const { activeBike, bikes, isLoading, error } = useActiveBike()
  const { getCurrentPosition } = useGeolocation()

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false)
  const [isStartingTouring, setIsStartingTouring] = useState(false)
  const [isMileageModalOpen, setIsMileageModalOpen] = useState(false)
  const [startMileageInput, setStartMileageInput] = useState('')

  const isAtGuestFuelLimit =
    isGuest && (activeBike?.fuelLogCount ?? 0) >= GUEST_ACCOUNT_LIMITS.FUEL_LOG
  const isAtGuestTouringLimit =
    isGuest && (activeBike?.touringCount ?? 0) >= GUEST_ACCOUNT_LIMITS.TOURING

  const handleStartTouring = async (startMileage?: number) => {
    if (!activeBike) return
    const myUserBikeId = activeBike.myUserBikeId
    const bikeName = getBikeDisplayName(activeBike)

    setIsStartingTouring(true)
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
      setIsStartingTouring(false)
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
      <div className={styles.container} data-testid="home-actions">
        {isUserNotRegisteredError ? (
          <>
            <p className={styles.message}>
              ユーザー登録の反映を確認しています。数秒後に再読み込みしてください。
            </p>
            <Button onClick={() => router.refresh()} size="sm" variant="cloud">
              再読み込み
            </Button>
          </>
        ) : (
          <p className={styles.message}>
            {error instanceof ApiV1Error
              ? error.message
              : 'バイク情報の取得に失敗しました'}
          </p>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.container} data-testid="home-actions">
        <p className={styles.message}>読み込み中...</p>
      </div>
    )
  }

  if (bikes.length === 0 || !activeBike) {
    return (
      <div className={styles.container} data-testid="home-actions">
        <p className={styles.message}>バイクを登録してください</p>
        <Button onClick={() => router.push('/app/bike/register')} size="sm">
          バイクを登録
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.container} data-testid="home-actions">
      {isFuelModalOpen && (
        <FuelLogRegisterModal
          bikeId={activeBike.myUserBikeId}
          onClose={() => setIsFuelModalOpen(false)}
          onSuccess={() => setIsFuelModalOpen(false)}
        />
      )}

      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        disabled={isAtGuestFuelLimit}
        onClick={() => setIsFuelModalOpen(true)}
      >
        <span className={styles.buttonContent}>
          <FuelIcon />
          給油を記録
        </span>
      </Button>
      {isAtGuestFuelLimit && (
        <p className={styles.limitNote}>
          ゲストアカウントは給油履歴を{GUEST_ACCOUNT_LIMITS.FUEL_LOG}
          件まで登録できます。
        </p>
      )}

      <Button
        type="button"
        variant="primary"
        outline
        fullWidth
        disabled={isStartingTouring || isAtGuestTouringLimit}
        onClick={handleOpenMileageModal}
        className={styles.secondaryButton}
      >
        <span className={styles.buttonContent}>
          <TouringIcon />
          {isStartingTouring ? '開始中...' : 'ツーリングを開始'}
        </span>
      </Button>
      {isAtGuestTouringLimit && (
        <p className={styles.limitNote}>
          ゲストアカウントはツーリングを{GUEST_ACCOUNT_LIMITS.TOURING}
          件まで登録できます。
        </p>
      )}

      {isMileageModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsMileageModalOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>出発時の走行距離</h3>

            <div className={styles.modalField}>
              <label className={styles.modalLabel}>
                現在の走行距離（km）
              </label>
              <input
                type="number"
                inputMode="numeric"
                className={styles.modalInput}
                placeholder="例：12345"
                value={startMileageInput}
                onChange={(e) => setStartMileageInput(e.target.value)}
                min={0}
                step={1}
              />
            </div>

            <div className={styles.modalActions}>
              <Button
                onClick={() => setIsMileageModalOpen(false)}
                variant="cloud"
                size="md"
                disabled={isStartingTouring}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleConfirmStart}
                variant="primary"
                size="md"
                disabled={isStartingTouring}
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
