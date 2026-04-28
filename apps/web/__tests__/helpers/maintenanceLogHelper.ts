import { app } from '@/lib/api/server/app'

/**
 * テスト用メンテナンス履歴を作成する
 */
export async function createTestMaintenanceLog(
  token: string,
  myUserBikeId: string,
  data: {
    performedAt: string
    mileage: number
    memo?: string | null
    items: Array<{
      maintenanceType: string
      value: number | null
    }>
    updateTotalMileage?: boolean
  }
): Promise<string> {
  const res = await app.request(
    `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        updateTotalMileage: false,
        ...data,
      }),
    }
  )

  const json = await res.json()
  return json.data.maintenanceLogId
}
