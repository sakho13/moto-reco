import { BASE_URL } from './env'

/**
 * API経由でツーリングにスポット・休憩を登録し、spotId を返す
 */
export async function registerTestSpot(
  token: string,
  myUserBikeId: string,
  touringId: string,
  spot: {
    type?: 'SPOT' | 'BREAK'
    name?: string
    memo?: string
    latitude?: number
    longitude?: number
    arrivedAt?: string
    departedAt?: string
  } = {}
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(spot),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(`スポット登録失敗: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { data: { spotId: string } }
  return json.data.spotId
}

/**
 * API経由でツーリングのスポットを更新する（スキップフラグの設定など）
 */
export async function updateTestSpot(
  token: string,
  myUserBikeId: string,
  touringId: string,
  spotId: string,
  update: {
    name?: string | null
    memo?: string | null
    latitude?: number | null
    longitude?: number | null
    arrivedAt?: string | null
    departedAt?: string | null
    isSkipped?: boolean
  }
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots/${spotId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(`スポット更新失敗: ${res.status} ${await res.text()}`)
  }
}
