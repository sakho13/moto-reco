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

/**
 * API経由で完了済みツーリングを任意の開始/終了日時で登録し、touringId を返す
 *
 * @remarks
 * 給油履歴の日付範囲フィルタなど、ツーリング期間を明示的に制御したいテストで使用する。
 */
export async function registerTestTouring(
  token: string,
  myUserBikeId: string,
  params: {
    title: string
    startDate: string
    endDate: string
    startMileage?: number
    endMileage?: number
  }
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/tourings`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: params.title,
        startDate: params.startDate,
        endDate: params.endDate,
        startMileage: params.startMileage,
        endMileage: params.endMileage,
        status: 'COMPLETED',
      }),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(`ツーリング登録失敗: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { data: { touringId: string } }
  return json.data.touringId
}
