'use client'

import { Flag } from 'lucide-react'
import useSWR from 'swr'
import styles from './TouringDestinationWidget.module.css'
import { weatherEmoji } from '@/lib/utils/weatherUtils'

type WeatherData = {
  temperature: number
  weatherCode: number
  description: string
  precipitationProbability: number | null
}

type TouringDestinationWidgetProps = {
  endLatitude: number
  endLongitude: number
  spotName?: string | null
  plannedEndDate?: string | null
  hasArrived: boolean
  onArrival: () => void | Promise<void>
  isArrivalLoading?: boolean
}

function formatPlannedTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

/**
 * 目的地の天気・プラン到着時刻・Googleマップリンクを表示するウィジェット
 */
const TouringDestinationWidget = ({
  endLatitude,
  endLongitude,
  spotName,
  plannedEndDate,
  hasArrived,
  onArrival,
  isArrivalLoading = false,
}: TouringDestinationWidgetProps) => {
  const { data: weather } = useSWR<WeatherData>(
    `/api/weather?lat=${endLatitude}&lng=${endLongitude}`,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('天気情報の取得に失敗しました')
      return res.json() as Promise<WeatherData>
    },
    { refreshInterval: 600_000 }
  )

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${endLatitude},${endLongitude}&travelmode=driving`

  return (
    <div
      className={`${styles.widget} ${hasArrived ? styles.arrivedWidget : ''}`}
    >
      <p className={styles.label}>
        {spotName ? `次のスポット: ${spotName}` : '次のスポット'}
      </p>

      {hasArrived ? (
        <p className={styles.arrivedText}>目的地に到着！</p>
      ) : (
        <>
          <div className={styles.infoRow}>
            {/* 天気・気温 */}
            <div className={styles.col}>
              {weather ? (
                <>
                  <span className={styles.weatherEmoji}>
                    {weatherEmoji(weather.weatherCode)}
                  </span>
                  <span className={styles.mainValue}>
                    {weather.temperature}°C
                  </span>
                  <span className={styles.subValue}>{weather.description}</span>
                  {weather.precipitationProbability !== null && (
                    <span className={styles.dim}>
                      降水確率 {weather.precipitationProbability}%
                    </span>
                  )}
                </>
              ) : (
                <span className={styles.dim}>取得中...</span>
              )}
            </div>

            <div className={styles.divider} />

            {/* プラン到着予定時刻 + Googleマップ */}
            <div className={styles.col}>
              <span className={styles.etaLabel}>到着予定</span>
              <span className={styles.mainValue}>
                {formatPlannedTime(plannedEndDate)}
              </span>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapsLink}
              >
                Googleマップ
              </a>
            </div>
          </div>

          <button
            className={styles.arrivalButton}
            onClick={onArrival}
            disabled={isArrivalLoading}
          >
            {!isArrivalLoading && <Flag size={15} />}
            {isArrivalLoading ? '記録中...' : '到着した'}
          </button>
        </>
      )}
    </div>
  )
}

export default TouringDestinationWidget
