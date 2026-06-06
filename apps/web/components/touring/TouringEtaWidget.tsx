'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import styles from './TouringEtaWidget.module.css'
import { useGeolocation } from '@/lib/hooks/useGeolocation'

type RoutingData = {
  durationSeconds: number
  distanceMeters: number
}

type TouringEtaWidgetProps = {
  endLatitude: number
  endLongitude: number
  /** 目的地に到着済みかどうか（スポットデータから導出して親が渡す） */
  hasArrived: boolean
  /** 「到着した」ボタン押下時に呼ぶコールバック */
  onArrival: () => Promise<void>
  /** 到着記録中の読み込み状態 */
  isArrivalLoading?: boolean
}

type CurrentPosition = {
  latitude: number
  longitude: number
} | null

/**
 * 目的地までの到着予定時間を表示するウィジェット
 *
 * @remarks
 * ブラウザの Geolocation API で現在地を取得し、5分ごとに ETA を再計算する。
 * GPS が許可されていない場合は案内メッセージを表示する。
 * 到着状態は親から hasArrived として受け取る（スポットテーブルで永続化）。
 */
const TouringEtaWidget = ({
  endLatitude,
  endLongitude,
  hasArrived,
  onArrival,
  isArrivalLoading = false,
}: TouringEtaWidgetProps) => {
  const { getCurrentPosition } = useGeolocation()
  const [currentPosition, setCurrentPosition] = useState<CurrentPosition>(null)
  const [geoStatus, setGeoStatus] = useState<
    'idle' | 'loading' | 'success' | 'denied' | 'error'
  >('idle')

  useEffect(() => {
    let cancelled = false

    const fetchPosition = async () => {
      setGeoStatus('loading')
      const { position, denied } = await getCurrentPosition()
      if (cancelled) return

      if (position) {
        setCurrentPosition({
          latitude: position.latitude,
          longitude: position.longitude,
        })
        setGeoStatus('success')
      } else if (denied) {
        setGeoStatus('denied')
      } else {
        setGeoStatus('error')
      }
    }

    void fetchPosition()

    // 5分ごとに現在地を再取得
    const interval = setInterval(() => {
      void fetchPosition()
    }, 300_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // getCurrentPosition は参照が変わらないため依存配列から除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 到着済みの場合はルーティングAPIを呼ばない
  const routingKey =
    currentPosition !== null && !hasArrived
      ? `/api/routing?fromLat=${currentPosition.latitude}&fromLng=${currentPosition.longitude}&toLat=${endLatitude}&toLng=${endLongitude}`
      : null

  const { data, error, isLoading } = useSWR<RoutingData>(
    routingKey,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('ルート情報の取得に失敗しました')
      return res.json() as Promise<RoutingData>
    },
    { refreshInterval: 300_000 }
  )

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours > 0) {
      return `約${hours}時間${remainingMinutes}分`
    }
    return `約${minutes}分`
  }

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `約${(meters / 1000).toFixed(1)}km`
    }
    return `約${meters}m`
  }

  return (
    <div
      className={`${styles.widget} ${hasArrived ? styles.arrivedWidget : ''}`}
    >
      <p className={styles.header}>
        {hasArrived ? '目的地' : '目的地までの到着予定'}
      </p>

      {hasArrived ? (
        <p className={styles.arrivedText}>到着！</p>
      ) : (
        <>
          {geoStatus === 'denied' && (
            <p className={styles.hint}>
              位置情報を許可すると到着予定時間が表示されます
            </p>
          )}

          {(geoStatus === 'idle' || geoStatus === 'loading') && (
            <p className={styles.loading}>位置情報を取得中...</p>
          )}

          {geoStatus === 'error' && (
            <p className={styles.error}>位置情報を取得できませんでした</p>
          )}

          {geoStatus === 'success' && isLoading && (
            <p className={styles.loading}>計算中...</p>
          )}

          {geoStatus === 'success' && error && (
            <p className={styles.error}>到着予定時間を取得できませんでした</p>
          )}

          {geoStatus === 'success' && data && (
            <>
              <p className={styles.etaText}>
                {formatDuration(data.durationSeconds)}
              </p>
              <p className={styles.subText}>
                {formatDistance(data.distanceMeters)}
              </p>
            </>
          )}

          <button
            className={styles.arrivalButton}
            onClick={onArrival}
            disabled={isArrivalLoading}
          >
            {isArrivalLoading ? '記録中...' : '到着した'}
          </button>
        </>
      )}
    </div>
  )
}

export default TouringEtaWidget
