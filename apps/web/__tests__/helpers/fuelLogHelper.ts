import { app } from '@/lib/api/server/app'

/**
 * テスト用燃料ログを作成する
 */
export async function createTestFuelLog(
  token: string,
  myUserBikeId: string,
  data: {
    refueledAt: string
    mileage: number
    previousMileage?: number
    amount: number
    totalPrice: number
    memo?: string | null
    updateTotalMileage?: boolean
    touringId?: string | null
  }
): Promise<string> {
  const payload = {
    previousMileage: data.previousMileage ?? data.mileage,
    ...data,
  }
  const res = await app.request(
    `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  const json = await res.json()
  return json.data.fuelLogId
}

/**
 * 複数の燃料ログを一括作成する
 */
export async function createMultipleFuelLogs(
  token: string,
  myUserBikeId: string,
  logsData: Array<{
    refueledAt: string
    mileage: number
    previousMileage?: number
    amount: number
    totalPrice: number
    memo?: string | null
  }>
): Promise<string[]> {
  const fuelLogIds: string[] = []

  for (const data of logsData) {
    const fuelLogId = await createTestFuelLog(token, myUserBikeId, data)
    fuelLogIds.push(fuelLogId)
  }

  return fuelLogIds
}
