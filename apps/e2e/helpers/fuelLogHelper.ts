import { BASE_URL } from './env'

/**
 * API経由で給油履歴を登録し、fuelLogId を返す
 */
export async function registerTestFuelLog(
  token: string,
  myUserBikeId: string,
  fuelLog: {
    refueledAt: string
    mileage: number
    previousMileage: number
    amount?: number
    totalPrice?: number
    memo?: string
    touringId?: string | null
  }
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refueledAt: fuelLog.refueledAt,
        mileage: fuelLog.mileage,
        previousMileage: fuelLog.previousMileage,
        amount: fuelLog.amount ?? 10,
        totalPrice: fuelLog.totalPrice ?? 1500,
        memo: fuelLog.memo ?? null,
        updateTotalMileage: false,
        touringId: fuelLog.touringId ?? null,
      }),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(`給油履歴登録失敗: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { data: { fuelLogId: string } }
  return json.data.fuelLogId
}
