'use client'

import { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import type { ApiResponseSpotDetail } from '@repo/shared-types'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import { BikeIcon } from '../icons/BikeIcon'
import styles from './TouringModeView.module.css'
import TouringEtaWidget from '@/components/touring/TouringEtaWidget'
import TouringRouteMap from '@/components/touring/TouringRouteMap'
import TouringWeatherWidget from '@/components/touring/TouringWeatherWidget'
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
  const [isBreakLoading, setIsBreakLoading] = useState(false)
  const { getCurrentPosition } = useGeolocation()

  const { data: spots } = useSWR(
    `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots`,
    async (url) => {
      const response = await apiGet(
        url as `/api/v1/user-bike/bike/${string}/tourings/${string}/spots`
      )
      return response.data as ApiResponseSpotDetail[]
    }
  )

  const currentBreak =
    spots?.find((s) => s.type === 'BREAK' && s.endAt === null) ?? null

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

  const formatBreakTime = (dateString: string) => {
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
        { type: 'BREAK', visitedAt: new Date() }
      )
      await mutate(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots`
      )
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
        { endAt: new Date() }
      )
      await mutate(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots`
      )
      toast.success('休憩を終了しました')
    } catch (error) {
      toast.error(
        error instanceof ApiV1Error ? error.message : '休憩の終了に失敗しました'
      )
    } finally {
      setIsBreakLoading(false)
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
        {/* ルート風の背景 */}
        <div className={styles.routeVisual}>
          <div className={styles.roadDash} />
        </div>

        {/* 上部: バイク名・タイトル・経過時間・休憩ボタン */}
        <div className={styles.topArea}>
          {/* 右上の休憩ボタン */}
          <div className={styles.breakCornerArea}>
            {currentBreak ? (
              <>
                <span className={styles.breakCornerStatus}>
                  休憩中 {formatBreakTime(currentBreak.visitedAt)}〜
                </span>
                <button
                  onClick={handleQuickBreakEnd}
                  disabled={isBreakLoading || isLoading}
                  className={styles.breakCornerEndButton}
                >
                  {isBreakLoading ? '...' : '休憩終了'}
                </button>
              </>
            ) : (
              <button
                onClick={handleQuickBreakStart}
                disabled={isBreakLoading || isLoading || spotLoading}
                className={styles.breakCornerButton}
              >
                {isBreakLoading ? '...' : '休憩を始める'}
              </button>
            )}
          </div>

          <div className={styles.bikeInfoArea}>
            <div className={styles.animatedBikeIcon}>
              <BikeIcon />
            </div>
            <h3 className={styles.bikeNameLarge}>{bikeName}</h3>
          </div>

          <h4 className={styles.touringTitle}>{title}</h4>
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

        {/* 中部: 天気・ETAウィジェット（目的地がある場合のみ） */}
        <div className={styles.middleArea}>
          {hasDestination ? (
            <>
              <TouringWeatherWidget
                endLatitude={endLatitude}
                endLongitude={endLongitude}
              />
              <TouringEtaWidget
                endLatitude={endLatitude}
                endLongitude={endLongitude}
              />
            </>
          ) : (
            <p className={styles.noDestinationHint}>
              プランで目的地を設定すると天気・到着予定時間が表示されます
            </p>
          )}
        </div>

        {/* 下部: スポット記録・終了ボタン */}
        <div className={styles.bottomArea}>
          <Button
            onClick={handleOpenSpotModal}
            disabled={isLoading || spotLoading}
            variant="cloud"
            size="sm"
            className={styles.spotButton}
          >
            スポットを記録
          </Button>

          <Button
            onClick={handleOpenEndMileageModal}
            disabled={isLoading}
            variant="danger"
            size="md"
            className={styles.endButton}
          >
            {isLoading ? '終了中...' : 'ツーリングを終了'}
          </Button>
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
    </>
  )
}
