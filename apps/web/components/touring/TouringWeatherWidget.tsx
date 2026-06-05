'use client'

import useSWR from 'swr'
import styles from './TouringWeatherWidget.module.css'

type WeatherData = {
  temperature: number
  weatherCode: number
  windSpeed: number
  description: string
  precipitationProbability: number | null
}

type TouringWeatherWidgetProps = {
  endLatitude: number
  endLongitude: number
}

/** WMO天気コードから絵文字への簡易マッピング */
function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  if (code <= 86) return '🌨️'
  return '⛈️'
}

/**
 * 目的地の現在天気を表示するウィジェット
 *
 * @remarks
 * 10分ごとに天気情報を再取得する。
 */
const TouringWeatherWidget = ({
  endLatitude,
  endLongitude,
}: TouringWeatherWidgetProps) => {
  const { data, error, isLoading } = useSWR<WeatherData>(
    `/api/weather?lat=${endLatitude}&lng=${endLongitude}`,
    async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('天気情報の取得に失敗しました')
      return res.json() as Promise<WeatherData>
    },
    { refreshInterval: 600_000 }
  )

  return (
    <div className={styles.widget}>
      <p className={styles.header}>目的地の天気</p>
      {isLoading && <p className={styles.loading}>取得中...</p>}
      {error && <p className={styles.error}>天気情報を取得できませんでした</p>}
      {data && (
        <div className={styles.content}>
          <span className={styles.weatherIcon}>
            {weatherEmoji(data.weatherCode)}
          </span>
          <div className={styles.details}>
            <span className={styles.temperature}>{data.temperature}°C</span>
            <span className={styles.description}>{data.description}</span>
            <span className={styles.subInfo}>
              風速 {data.windSpeed}km/h
              {data.precipitationProbability !== null &&
                ` / 降水確率 ${data.precipitationProbability}%`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default TouringWeatherWidget
