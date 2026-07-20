import { BASE_URL } from './env'

/**
 * API 経由でテスト用バイクを登録し、myUserBikeId を返す
 */
export async function registerTestBike(
  token: string,
  options: {
    displacement?: number
    totalMileage?: number
    nickname?: string
  } = {}
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/user-bike/register`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bikeId: null,
      displacement: options.displacement ?? 400,
      serialNumber: null,
      nickname: options.nickname ?? null,
      purchaseDate: null,
      purchasePrice: null,
      purchaseMileage: null,
      totalMileage: options.totalMileage ?? 10000,
    }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    throw new Error(`バイク登録失敗: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { data: { myUserBikeId: string } }
  return json.data.myUserBikeId
}
