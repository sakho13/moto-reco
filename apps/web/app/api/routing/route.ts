import { NextRequest, NextResponse } from 'next/server'

type RoutingResponse = {
  durationSeconds: number
  distanceMeters: number
}

/**
 * 2点間のルート情報（所要時間・距離）を取得するプロキシエンドポイント
 *
 * @remarks
 * OSRM の公開API（router.project-osrm.org）をサーバーサイドでプロキシする。
 * ルーティングは driving（自動車）で計算する。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const fromLat = searchParams.get('fromLat')
  const fromLng = searchParams.get('fromLng')
  const toLat = searchParams.get('toLat')
  const toLng = searchParams.get('toLng')

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return NextResponse.json(
      { error: 'fromLat, fromLng, toLat, toLng は必須パラメータです' },
      { status: 400 }
    )
  }

  const from = {
    lat: parseFloat(fromLat),
    lng: parseFloat(fromLng),
  }
  const to = {
    lat: parseFloat(toLat),
    lng: parseFloat(toLng),
  }

  if (isNaN(from.lat) || isNaN(from.lng) || isNaN(to.lat) || isNaN(to.lng)) {
    return NextResponse.json(
      { error: '座標は数値で指定してください' },
      { status: 400 }
    )
  }

  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`

  const res = await fetch(url, {
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: 'ルート情報の取得に失敗しました' },
      { status: 502 }
    )
  }

  const json = (await res.json()) as {
    code?: string
    routes?: Array<{
      duration: number
      distance: number
    }>
  }

  if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
    return NextResponse.json(
      { error: 'ルートが見つかりませんでした' },
      { status: 404 }
    )
  }

  const firstRoute = json.routes[0]
  if (!firstRoute) {
    return NextResponse.json(
      { error: 'ルートが見つかりませんでした' },
      { status: 404 }
    )
  }

  const response: RoutingResponse = {
    durationSeconds: Math.round(firstRoute.duration),
    distanceMeters: Math.round(firstRoute.distance),
  }

  return NextResponse.json(response)
}
