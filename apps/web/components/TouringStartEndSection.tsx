'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Button } from '@repo/ui/button'
import { toast } from '@repo/ui/sonner'
import { BikeIcon } from './icons/BikeIcon'
import { TouringIcon } from './icons/TouringIcon'
import styles from './TouringStartEndSection.module.css'
import { apiGet, apiPost } from '@/lib/api/client'
import { ApiV1Error } from '@/lib/api/server/errors/ApiV1Error'
import { useGeolocation } from '@/lib/hooks/useGeolocation'

type BikeWithTouring = {
  myUserBikeId: string
  bikeName: string
  ongoingTouring: {
    touringId: string
    title: string
    startDate: string
  } | null
}

export const TouringStartEndSection = () => {
  const router = useRouter()
  const [loadingBikeId, setLoadingBikeId] = useState<string | null>(null)

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

  // 全バイクの進行中ツーリングを一括取得
  const { data: ongoingTouringsData } = useSWR(
    '/api/v1/user-bike/bikes/ongoing-tourings',
    async (url) => {
      const response = await apiGet(url)
      return response.data
    }
  )

  const ongoingTourings = ongoingTouringsData?.bikes ?? []

  // バイク情報と進行中ツーリング情報をマージ（ループ内でHooksを呼ばない）
  const bikesWithTouring: BikeWithTouring[] = bikes.map((bike) => {
    const bikeName =
      bike.nickname ||
      `${bike.manufacturerName || ''} ${bike.modelName || '不明なバイク'}`.trim()

    // 進行中ツーリング情報を検索
    const ongoingData = ongoingTourings.find(
      (ot) => ot.myUserBikeId === bike.myUserBikeId
    )

    return {
      myUserBikeId: bike.myUserBikeId,
      bikeName,
      ongoingTouring: ongoingData?.ongoingTouring
        ? {
            touringId: ongoingData.ongoingTouring.touringId,
            title: ongoingData.ongoingTouring.title,
            startDate: ongoingData.ongoingTouring.startDate,
          }
        : null,
    }
  })

  // 進行中のツーリングがあるバイクを探す
  const activeBike = bikesWithTouring.find(
    (bike) => bike.ongoingTouring !== null
  )

  const handleStartTouring = async (myUserBikeId: string, bikeName: string) => {
    setLoadingBikeId(myUserBikeId)
    try {
      const now = new Date()
      const defaultTitle = `${bikeName} ${now.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
      })}のツーリング`

      await apiPost(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end` as const,
        {
          action: 'start',
          title: defaultTitle,
          startDate: now.toISOString(),
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

  const handleEndTouring = async (myUserBikeId: string, touringId: string) => {
    setLoadingBikeId(myUserBikeId)
    try {
      await apiPost(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end` as const,
        {
          action: 'end',
          touringId,
          endDate: new Date().toISOString(),
        }
      )

      toast.success('ツーリングを終了しました')
      // SWR再検証
      await mutate('/api/v1/user-bike/bikes/ongoing-tourings')
    } catch (error) {
      if (error instanceof ApiV1Error) {
        toast.error(error.message)
      } else {
        toast.error('ツーリングの終了に失敗しました')
      }
    } finally {
      setLoadingBikeId(null)
    }
  }

  if (bikesError) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>ツーリング</h2>
        </div>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>
            {bikesError instanceof ApiV1Error
              ? bikesError.message
              : 'バイク情報の取得に失敗しました'}
          </p>
        </div>
      </div>
    )
  }

  if (bikesLoading) {
    return (
      <div className={styles.container}>
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
    return (
      <div className={styles.container}>
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

  // ツーリング中のバイクがある場合: 大きなカードを表示
  if (activeBike?.ongoingTouring) {
    return (
      <div className={styles.container}>
        <ActiveTouringCard
          bike={activeBike}
          touring={activeBike.ongoingTouring}
          isLoading={loadingBikeId === activeBike.myUserBikeId}
          onEnd={() =>
            handleEndTouring(
              activeBike.myUserBikeId,
              activeBike.ongoingTouring!.touringId
            )
          }
        />
      </div>
    )
  }

  // 非ツーリング中: バイク選択グリッド
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <TouringIcon />
          <h2 className={styles.title}>今すぐツーリング</h2>
        </div>
      </div>

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
                  handleStartTouring(bike.myUserBikeId, bike.bikeName)
                }
                disabled={isLoading}
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
    </div>
  )
}

// ツーリング中の大きなカード
type ActiveTouringCardProps = {
  bike: BikeWithTouring
  touring: NonNullable<BikeWithTouring['ongoingTouring']>
  isLoading: boolean
  onEnd: () => void
}

const ActiveTouringCard = ({
  bike,
  touring,
  isLoading,
  onEnd,
}: ActiveTouringCardProps) => {
  const [elapsedTime, setElapsedTime] = useState('')
  const [showSpotModal, setShowSpotModal] = useState(false)
  const [spotName, setSpotName] = useState('')
  const [spotMemo, setSpotMemo] = useState('')
  const [spotLoading, setSpotLoading] = useState(false)
  const [locationText, setLocationText] = useState<string | null>(null)
  const { getCurrentPosition } = useGeolocation()

  useEffect(() => {
    const updateElapsedTime = () => {
      const start = new Date(touring.startDate)
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
  }, [touring.startDate])

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

  const handleOpenSpotModal = async () => {
    setSpotName('')
    setSpotMemo('')
    setLocationText(null)
    setShowSpotModal(true)

    const position = await getCurrentPosition()
    if (position) {
      setLocationText(
        `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
      )
    } else {
      setLocationText('位置情報を取得できませんでした')
    }
  }

  const handleRegisterSpot = async () => {
    setSpotLoading(true)
    try {
      const parts = locationText?.includes(',') ? locationText.split(',') : null
      const position =
        parts && parts[0] !== undefined && parts[1] !== undefined
          ? {
              latitude: parseFloat(parts[0]),
              longitude: parseFloat(parts[1]),
            }
          : null

      await apiPost(
        `/api/v1/user-bike/bike/${bike.myUserBikeId}/tourings/${touring.touringId}/spots` as const,
        {
          name: spotName.trim() || undefined,
          memo: spotMemo.trim() || undefined,
          latitude: position?.latitude,
          longitude: position?.longitude,
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

  return (
    <>
      <div className={styles.activeTouringCard}>
        {/* ルート風の背景 */}
        <div className={styles.routeVisual}>
          <div className={styles.roadDash} />
        </div>

        {/* バイク情報 */}
        <div className={styles.bikeInfoArea}>
          <div className={styles.animatedBikeIcon}>
            <BikeIcon />
          </div>
          <h3 className={styles.bikeNameLarge}>{bike.bikeName}</h3>
        </div>

        {/* ツーリング情報 */}
        <div className={styles.touringInfoArea}>
          <h4 className={styles.touringTitle}>{touring.title}</h4>
          <div className={styles.elapsedTime}>{elapsedTime}</div>
          <p className={styles.startDateTime}>
            {formatStartDateTime(touring.startDate)} 開始
          </p>
        </div>

        {/* アクションボタン */}
        <div className={styles.actionButtons}>
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
            onClick={onEnd}
            disabled={isLoading}
            variant="danger"
            size="md"
            className={styles.endButton}
          >
            {isLoading ? '終了中...' : 'ツーリングを終了'}
          </Button>
        </div>
      </div>

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

            <p className={styles.spotModalLocation}>
              {locationText === null
                ? '位置情報を取得中...'
                : locationText.includes(',')
                  ? `現在地: ${locationText}`
                  : locationText}
            </p>

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
                disabled={spotLoading || locationText === null}
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
