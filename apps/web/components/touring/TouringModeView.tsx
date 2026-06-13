'use client'

import { Coffee, Fuel, MapPin, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import { BikeIcon } from '../icons/BikeIcon'
import styles from './TouringModeView.module.css'
import { FuelLogRegisterModal } from '@/components/fuel-log/FuelLogRegisterModal'
import TouringDestinationWidget from '@/components/touring/TouringDestinationWidget'
import TouringRouteMap from '@/components/touring/TouringRouteMap'
import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { useGeolocation } from '@/lib/hooks/useGeolocation'

type TouringModeViewProps = {
  myUserBikeId: string
  bikeName: string
  touringId: string
  title: string
  startDate: string
  startMileage: number | null
  endLatitude: number | null
  endLongitude: number | null
  isLoading: boolean
  onEnd: (endMileage?: number) => void
}

/**
 * ツーリング中の全画面表示コンポーネント
 *
 * @remarks
 * ツーリング中はホームページ全体をこのコンポーネントで占有する。
 * 天気・ETA ウィジェットは endLatitude/endLongitude がある場合のみ表示する。
 */
export const TouringModeView = ({
  myUserBikeId,
  bikeName,
  touringId,
  title,
  startDate,
  startMileage,
  endLatitude,
  endLongitude,
  isLoading,
  onEnd,
}: TouringModeViewProps) => {
  const [elapsedTime, setElapsedTime] = useState('')
  const [showSpotModal, setShowSpotModal] = useState(false)
  const [spotName, setSpotName] = useState('')
  const [spotMemo, setSpotMemo] = useState('')
  const [spotLoading, setSpotLoading] = useState(false)
  const [geoPosition, setGeoPosition] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [geoStatus, setGeoStatus] = useState<
    'loading' | 'success' | 'denied' | 'error'
  >('loading')
  const [showEndMileageModal, setShowEndMileageModal] = useState(false)
  const [endMileageInput, setEndMileageInput] = useState('')
  const [endMileageError, setEndMileageError] = useState('')
  const [showFuelLogModal, setShowFuelLogModal] = useState(false)
  const [isBreakLoading, setIsBreakLoading] = useState(false)
  const { getCurrentPosition } = useGeolocation()

  const { data: spots, mutate: mutateSpots } = useSWR(
    `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots`,
    async (url) => {
      const response = await apiGet(
        url as `/api/v1/user-bike/bike/${string}/tourings/${string}/spots`
      )
      return response.data as ApiResponseSpotDetail[]
    }
  )

  const currentBreak =
    spots?.find(
      (s) => s.type === 'BREAK' && s.arrivedAt !== null && s.departedAt === null
    ) ?? null

  // SPOT タイプのスポットを sortOrder 順に並べ、最初の未到着（arrivedAt === null）を次の目的地とする
  const nextDestinationSpot =
    spots
      ?.filter((s) => s.type === 'SPOT')
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .find((s) => s.arrivedAt === null) ?? null

  const hasReachedNextDestination =
    nextDestinationSpot === null &&
    (spots?.filter((s) => s.type === 'SPOT').length ?? 0) > 0

  useEffect(() => {
    const updateElapsedTime = () => {
      const start = new Date(startDate)
      const now = new Date()
      const diff = now.getTime() - start.getTime()

      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)

      if (hours > 0) {
        setElapsedTime(`${hours}時間${minutes % 60}分`)
      } else if (minutes > 0) {
        setElapsedTime(`${minutes}分`)
      } else {
        setElapsedTime(`${seconds}秒`)
      }
    }

    updateElapsedTime()
    const interval = setInterval(updateElapsedTime, 1000)

    return () => clearInterval(interval)
  }, [startDate])

  const formatStartDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  const formatBreakTime = (dateString: string | null) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }

  const handleOpenSpotModal = async () => {
    setSpotName('')
    setSpotMemo('')
    setGeoPosition(null)
    setGeoStatus('loading')
    setShowSpotModal(true)

    const { position, denied } = await getCurrentPosition()
    if (position) {
      setGeoPosition({ lat: position.latitude, lng: position.longitude })
      setGeoStatus('success')
    } else if (denied) {
      setGeoStatus('denied')
    } else {
      setGeoStatus('error')
    }
  }

  const handleRegisterSpot = async () => {
    setSpotLoading(true)
    try {
      await apiPost(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots` as const,
        {
          name: spotName.trim() || undefined,
          memo: spotMemo.trim() || undefined,
          latitude: geoPosition?.lat,
          longitude: geoPosition?.lng,
        }
      )

      toast.success('スポットを記録しました')
      setShowSpotModal(false)
    } catch (error) {
      if (error instanceof ApiV1Error) {
        toast.error(error.message)
      } else {
        toast.error('スポットの記録に失敗しました')
      }
    } finally {
      setSpotLoading(false)
    }
  }

  const handleQuickBreakStart = async () => {
    setIsBreakLoading(true)
    try {
      await apiPost(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots` as const,
        { type: 'BREAK', arrivedAt: new Date() }
      )
      await mutateSpots()
      toast.success('休憩を開始しました')
    } catch (error) {
      toast.error(
        error instanceof ApiV1Error ? error.message : '休憩の開始に失敗しました'
      )
    } finally {
      setIsBreakLoading(false)
    }
  }

  const handleQuickBreakEnd = async () => {
    if (!currentBreak) return
    setIsBreakLoading(true)
    try {
      await apiPatch(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots/${currentBreak.spotId}` as const,
        { departedAt: new Date() }
      )
      await mutateSpots()
      toast.success('休憩を終了しました')
    } catch (error) {
      toast.error(
        error instanceof ApiV1Error ? error.message : '休憩の終了に失敗しました'
      )
    } finally {
      setIsBreakLoading(false)
    }
  }

  const handleArrivalRecord = async () => {
    if (!nextDestinationSpot) return
    try {
      await apiPatch(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots/${nextDestinationSpot.spotId}` as const,
        { arrivedAt: new Date() }
      )
      await mutateSpots()
      toast.success('スポットへの到着を記録しました')
    } catch (error) {
      toast.error(
        error instanceof ApiV1Error ? error.message : '到着の記録に失敗しました'
      )
    }
  }

  const [isSkipLoading, setIsSkipLoading] = useState(false)

  const handleSkipSpot = async () => {
    if (!nextDestinationSpot) return
    setIsSkipLoading(true)
    try {
      await apiPatch(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots/${nextDestinationSpot.spotId}` as const,
        { isSkipped: true }
      )
      await mutateSpots()
      toast.success('スポットをスキップしました')
    } catch (error) {
      toast.error(
        error instanceof ApiV1Error ? error.message : 'スキップに失敗しました'
      )
    } finally {
      setIsSkipLoading(false)
    }
  }

  const handleOpenEndMileageModal = () => {
    setEndMileageInput('')
    setEndMileageError('')
    setShowEndMileageModal(true)
  }

  const handleConfirmEnd = () => {
    const parsed = parseInt(endMileageInput, 10)
    const mileage =
      endMileageInput !== '' && !isNaN(parsed) ? parsed : undefined
    if (
      mileage !== undefined &&
      startMileage !== null &&
      mileage < startMileage
    ) {
      setEndMileageError(
        `終了時の走行距離は開始時（${startMileage.toLocaleString()}km）以上で入力してください`
      )
      return
    }
    setShowEndMileageModal(false)
    onEnd(mileage)
  }

  const hasDestination = endLatitude !== null && endLongitude !== null

  return (
    <>
      <div className={styles.container} data-testid="touring-mode-view">
        {/* 右上: ツーリング終了ボタン */}
        <div className={styles.endCornerArea}>
          <button
            onClick={handleOpenEndMileageModal}
            disabled={isLoading}
            className={styles.endCornerButton}
          >
            {isLoading ? '終了中...' : 'ツーリングを終了'}
          </button>
        </div>

        {/* バイク名 */}
        <div className={styles.bikeInfoArea}>
          <div className={styles.animatedBikeIcon}>
            <BikeIcon />
          </div>
          <h3 className={styles.bikeNameLarge}>{bikeName}</h3>
        </div>

        {/* タイトル */}
        <h4 className={styles.touringTitle}>{title}</h4>

        {/* 全スポット到達バナー */}
        {hasReachedNextDestination && (
          <div className={styles.arrivedBanner}>
            <MapPin size={15} />
            全スポットに到達しました！
          </div>
        )}

        {/* 経過時間（左）＋ 目的地ウィジェット（右）横並び */}
        <div className={styles.timeRow}>
          <div className={styles.timeInfo}>
            <div className={styles.elapsedTime}>{elapsedTime}</div>
            <p className={styles.startDateTime}>
              {formatStartDateTime(startDate)} 開始
            </p>
            {startMileage !== null && (
              <p className={styles.startMileageInfo}>
                出発時走行距離: {startMileage.toLocaleString()}km
              </p>
            )}
          </div>

          {/* 次の未到着スポットがあればそのウィジェットを表示、なければツーリングマスタの目的地を表示 */}
          {nextDestinationSpot?.latitude !== null &&
          nextDestinationSpot?.latitude !== undefined ? (
            <div className={styles.widgetSection}>
              <TouringDestinationWidget
                endLatitude={nextDestinationSpot.latitude}
                endLongitude={nextDestinationSpot.longitude!}
                spotName={nextDestinationSpot.name}
                plannedEndDate={nextDestinationSpot.plannedArrivalAt}
                hasArrived={false}
                onArrival={handleArrivalRecord}
                onSkip={handleSkipSpot}
                isSkipLoading={isSkipLoading}
              />
            </div>
          ) : hasDestination ? (
            <div className={styles.widgetSection}>
              <TouringDestinationWidget
                endLatitude={endLatitude!}
                endLongitude={endLongitude!}
                spotName="目的地"
                hasArrived={hasReachedNextDestination}
                onArrival={handleArrivalRecord}
              />
            </div>
          ) : null}
        </div>

        {!nextDestinationSpot && !hasDestination && (
          <p className={styles.noDestinationHint}>
            プランで目的地を設定すると天気・到着予定時間が表示されます
          </p>
        )}

        {/* 下部: スポット記録・休憩・終了ボタン */}
        <div className={styles.bottomArea}>
          <Button
            onClick={handleOpenSpotModal}
            disabled={isLoading || spotLoading}
            variant="primary"
            size="lg"
            fullWidth
            className={styles.spotButton}
          >
            <MapPin size={18} />
            スポットを記録
          </Button>

          {currentBreak && (
            <p className={styles.breakStatus}>
              休憩中 {formatBreakTime(currentBreak.arrivedAt)}〜
            </p>
          )}

          <div className={styles.bottomRow}>
            {currentBreak ? (
              <button
                onClick={handleQuickBreakEnd}
                disabled={isBreakLoading || isLoading}
                className={styles.breakButton}
              >
                <Timer size={15} />
                {isBreakLoading ? '...' : '休憩を終了'}
              </button>
            ) : (
              <button
                onClick={handleQuickBreakStart}
                disabled={isBreakLoading || isLoading || spotLoading}
                className={styles.breakButton}
              >
                <Coffee size={15} />
                {isBreakLoading ? '...' : '休憩を始める'}
              </button>
            )}

            <button
              onClick={() => setShowFuelLogModal(true)}
              disabled={isLoading}
              className={styles.fuelButton}
            >
              <Fuel size={15} />
              給油を記録
            </button>
          </div>
        </div>
      </div>

      {/* 終了時 走行距離入力モーダル */}
      {showEndMileageModal && (
        <div
          className={styles.spotModalOverlay}
          onClick={() => setShowEndMileageModal(false)}
        >
          <div
            className={styles.spotModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.spotModalTitle}>到着時の走行距離</h3>

            {startMileage !== null && (
              <p className={styles.mileageModalHint}>
                出発時走行距離: {startMileage.toLocaleString()}km
              </p>
            )}

            <div className={styles.spotModalField}>
              <label className={styles.spotModalLabel}>
                現在の走行距離（km）
              </label>
              <input
                type="number"
                inputMode="numeric"
                className={styles.spotModalInput}
                placeholder="例：12400"
                value={endMileageInput}
                onChange={(e) => {
                  setEndMileageInput(e.target.value)
                  setEndMileageError('')
                }}
                min={startMileage ?? 0}
                step={1}
              />
              {endMileageError && (
                <p className={styles.mileageModalError}>{endMileageError}</p>
              )}
            </div>

            <div className={styles.spotModalActions}>
              <Button
                onClick={() => setShowEndMileageModal(false)}
                variant="cloud"
                size="md"
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleConfirmEnd}
                variant="danger"
                size="md"
                disabled={isLoading}
              >
                終了する
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* スポット記録モーダル */}
      {showSpotModal && (
        <div
          className={styles.spotModalOverlay}
          onClick={() => setShowSpotModal(false)}
        >
          <div
            className={styles.spotModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.spotModalTitle}>スポットを記録</h3>

            <div className={styles.spotModalField}>
              <label className={styles.spotModalLabel}>
                スポット名（任意）
              </label>
              <input
                type="text"
                className={styles.spotModalInput}
                placeholder="例：道の駅 ○○"
                value={spotName}
                onChange={(e) => setSpotName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className={styles.spotModalField}>
              <label className={styles.spotModalLabel}>メモ（任意）</label>
              <textarea
                className={styles.spotModalTextarea}
                placeholder="感想や覚えておきたいことを入力"
                value={spotMemo}
                onChange={(e) => setSpotMemo(e.target.value)}
                maxLength={500}
              />
            </div>

            <div className={styles.spotMapArea}>
              {geoStatus === 'loading' && (
                <div className={styles.spotMapMessage}>位置情報を取得中...</div>
              )}
              {geoStatus === 'denied' && (
                <div className={styles.spotMapMessage}>
                  位置情報の使用が許可されていません
                </div>
              )}
              {geoStatus === 'error' && (
                <div className={styles.spotMapMessage}>
                  位置情報を取得できませんでした
                </div>
              )}
              {geoStatus === 'success' && geoPosition && (
                <TouringRouteMap
                  points={[
                    {
                      lat: geoPosition.lat,
                      lng: geoPosition.lng,
                      label: '現在地',
                      type: 'spot',
                    },
                  ]}
                  containerClassName={styles.spotMap}
                />
              )}
            </div>

            <div className={styles.spotModalActions}>
              <Button
                onClick={() => setShowSpotModal(false)}
                variant="cloud"
                size="md"
                disabled={spotLoading}
              >
                キャンセル
              </Button>
              <Button
                onClick={handleRegisterSpot}
                variant="primary"
                size="md"
                disabled={spotLoading || geoStatus === 'loading'}
              >
                {spotLoading ? '記録中...' : '記録する'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showFuelLogModal && (
        <FuelLogRegisterModal
          bikeId={myUserBikeId}
          touringId={touringId}
          onClose={() => setShowFuelLogModal(false)}
          onSuccess={() => setShowFuelLogModal(false)}
        />
      )}
    </>
  )
}
