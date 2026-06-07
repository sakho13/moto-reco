const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000'

/**
 * API経由でツーリングを開始し、touringId を返す
 */
export async function startTestTouring(
  token: string,
  myUserBikeId: string,
  title: string
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
        title,
        startDate: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(`ツーリング開始失敗: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { data: { touringId: string } }
  return json.data.touringId
}

/**
 * API経由でツーリングを終了する
 */
export async function endTestTouring(
  token: string,
  myUserBikeId: string,
  touringId: string
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'end',
        touringId,
        endDate: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(`ツーリング終了失敗: ${res.status} ${await res.text()}`)
  }
}
