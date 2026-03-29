import { app } from '@/lib/api/server/app'

/**
 * テスト用ツーリングを作成する
 */
export async function createTestTouring(
  token: string,
  myUserBikeId: string,
  data: {
    title: string
    startDate: string
    endDate: string
    startMileage?: number
    endMileage?: number
  }
): Promise<string> {
  const res = await app.request(
    `/api/v1/user-bike/bike/${myUserBikeId}/tourings`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  )

  const json = await res.json()
  return json.data.touringId
}

/**
 * 複数のツーリングを一括作成する
 */
export async function createMultipleTourings(
  token: string,
  myUserBikeId: string,
  touringsData: Array<{
    title: string
    startDate: string
    endDate: string
    startMileage?: number
    endMileage?: number
  }>
): Promise<string[]> {
  const touringIds: string[] = []

  for (const data of touringsData) {
    const touringId = await createTestTouring(token, myUserBikeId, data)
    touringIds.push(touringId)
  }

  return touringIds
}
