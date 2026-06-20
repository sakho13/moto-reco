import { NextRequest, NextResponse } from 'next/server'
import { getCurrentDate } from '@repo/shared-utils'

type WeatherResponse = {
  temperature: number
  weatherCode: number
  windSpeed: number
  description: string
  precipitationProbability: number | null
}

/** WMO天気コードから日本語の天気説明へのマッピング */
const WMO_CODE_MAP: Record<number, string> = {
  0: '快晴',
  1: 'ほぼ晴れ',
  2: '部分的に曇り',
  3: '曇り',
  45: '霧',
  48: '着氷性の霧',
  51: '霧雨（弱）',
  53: '霧雨（並）',
  55: '霧雨（強）',
  56: '着氷性の霧雨（弱）',
  57: '着氷性の霧雨（強）',
  61: '小雨',
  63: '雨',
  65: '大雨',
  66: '着氷性の雨（弱）',
  67: '着氷性の雨（強）',
  71: '小雪',
  73: '雪',
  75: '大雪',
  77: '霰',
  80: 'にわか雨（弱）',
  81: 'にわか雨',
  82: 'にわか雨（強）',
  85: 'にわか雪（弱）',
  86: 'にわか雪（強）',
  95: '雷雨',
  96: '雹を伴う雷雨（弱）',
  99: '雹を伴う雷雨（強）',
}

function describeWeather(code: number): string {
  return WMO_CODE_MAP[code] ?? '不明'
}

/**
 * 目的地の現在天気を取得するプロキシエンドポイント
 *
 * @remarks
 * Open-Meteo の無料APIをサーバーサイドでプロキシして返す。
 * クライアントから直接 Open-Meteo を叩くとCORSの問題が起きることがあるため、
 * サーバーサイドでプロキシする。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'lat と lng は必須パラメータです' },
      { status: 400 }
    )
  }

  const latitude = parseFloat(lat)
  const longitude = parseFloat(lng)

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: 'lat と lng は数値で指定してください' },
      { status: 400 }
    )
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(latitude))
  url.searchParams.set('longitude', String(longitude))
  url.searchParams.set('current_weather', 'true')
  url.searchParams.set('hourly', 'temperature_2m,precipitation_probability')
  url.searchParams.set('timezone', 'UTC')
  url.searchParams.set('forecast_days', '1')

  const res = await fetch(url.toString(), {
    next: { revalidate: 600 },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: '天気情報の取得に失敗しました' },
      { status: 502 }
    )
  }

  const json = (await res.json()) as {
    current_weather?: {
      temperature: number
      weathercode: number
      windspeed: number
    }
    hourly?: {
      time: string[]
      precipitation_probability: (number | null)[]
    }
  }

  if (!json.current_weather) {
    return NextResponse.json(
      { error: '天気情報の解析に失敗しました' },
      { status: 502 }
    )
  }

  const { temperature, weathercode, windspeed } = json.current_weather

  // 現在時刻に最も近い時間帯の降水確率を取得
  let precipitationProbability: number | null = null
  if (json.hourly) {
    const nowIso = getCurrentDate().toISOString().slice(0, 13)
    const idx = json.hourly.time.findIndex((t) => t.startsWith(nowIso))
    if (idx !== -1) {
      precipitationProbability =
        json.hourly.precipitation_probability[idx] ?? null
    }
  }

  const response: WeatherResponse = {
    temperature,
    weatherCode: weathercode,
    windSpeed: windspeed,
    description: describeWeather(weathercode),
    precipitationProbability,
  }

  return NextResponse.json(response)
}
