type GeoPoint = { lat: number; lng: number }

/**
 * 複数地点を経由するGoogleマップ経路URLを生成する。
 * 地点が1つのみの場合は場所検索URLを返す。
 */
export function buildGoogleMapsRouteUrl(points: GeoPoint[]): string | null {
  const first = points[0]
  const last = points[points.length - 1]
  if (!first) return null
  if (points.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${first.lat},${first.lng}`
  }
  if (!last) return null
  const origin = `${first.lat},${first.lng}`
  const destination = `${last.lat},${last.lng}`
  const waypoints = points
    .slice(1, -1)
    .map((p) => `${p.lat},${p.lng}`)
    .join('|')
  const base = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
  return waypoints ? `${base}&waypoints=${encodeURIComponent(waypoints)}` : base
}

/**
 * 2地点間のGoogleマップ経路URLを生成する。
 */
export function buildGoogleMapsTwoPointUrl(
  from: GeoPoint,
  to: GeoPoint
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}`
}
