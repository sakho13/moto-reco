import { BASE_URL } from './env'

type TouringPlanLocation = {
  latitude: number
  longitude: number
  name?: string
  memo?: string
}

type TouringPlanDestinationLocation = TouringPlanLocation & {
  travelMinutesFromPrev?: number
  routeTypeFromPrev?: 'GENERAL' | 'HIGHWAY' | 'MIXED'
}

/**
 * API経由でツーリングプランを登録し、touringPlanId を返す
 */
export async function registerTestTouringPlan(
  token: string,
  myUserBikeId: string,
  title: string,
  options: {
    startLocation?: TouringPlanLocation
    destinationLocation?: TouringPlanDestinationLocation
  } = {}
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        startLocation: options.startLocation,
        destinationLocation: options.destinationLocation,
      }),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(
      `ツーリングプラン登録失敗: ${res.status} ${await res.text()}`
    )
  }
  const json = (await res.json()) as { data: { touringPlanId: string } }
  return json.data.touringPlanId
}

/**
 * API経由でツーリングプランの出発地を設定・解除する（location=nullで解除）
 */
export async function setTouringPlanStartLocation(
  token: string,
  myUserBikeId: string,
  touringPlanId: string,
  location: TouringPlanLocation | null
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(location),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(`出発地設定失敗: ${res.status} ${await res.text()}`)
  }
}

/**
 * API経由でツーリングプランの目的地を設定・解除する（location=nullで解除）
 */
export async function setTouringPlanDestinationLocation(
  token: string,
  myUserBikeId: string,
  touringPlanId: string,
  location: TouringPlanDestinationLocation | null
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/destination-location`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(location),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(`目的地設定失敗: ${res.status} ${await res.text()}`)
  }
}

/**
 * API経由でツーリングプランに経由地・休憩スポットを追加し、touringPlanSpotId を返す
 */
export async function addTouringPlanSpot(
  token: string,
  myUserBikeId: string,
  touringPlanId: string,
  spot: {
    type: 'SPOT' | 'BREAK'
    name?: string
    memo?: string
    latitude?: number
    longitude?: number
    stayMinutes?: number
    travelMinutesFromPrev?: number
    routeTypeFromPrev?: 'GENERAL' | 'HIGHWAY' | 'MIXED'
  }
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
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
    throw new Error(`プランスポット登録失敗: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { data: { touringPlanSpotId: string } }
  return json.data.touringPlanSpotId
}

/**
 * API経由でツーリングプランからツーリングを開始し、touringId を返す
 */
export async function startTouringFromPlan(
  token: string,
  myUserBikeId: string,
  touringPlanId: string
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start',
        touringPlanId,
        startDate: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(
      `プランからのツーリング開始失敗: ${res.status} ${await res.text()}`
    )
  }
  const json = (await res.json()) as { data: { touringId: string } }
  return json.data.touringId
}
