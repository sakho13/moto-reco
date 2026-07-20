const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000'

/**
 * API経由でメンテナンス履歴を登録し、maintenanceLogId を返す
 */
export async function registerTestMaintenanceLog(
  token: string,
  myUserBikeId: string,
  maintenanceLog: {
    performedAt: string
    mileage: number
    memo?: string
    maintenanceType?: string
  }
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        performedAt: maintenanceLog.performedAt,
        mileage: maintenanceLog.mileage,
        memo: maintenanceLog.memo ?? null,
        items: [
          {
            maintenanceType: maintenanceLog.maintenanceType ?? 'ENGINE_OIL',
            value: 1,
          },
        ],
        updateTotalMileage: false,
      }),
      signal: AbortSignal.timeout(30_000),
    }
  )
  if (!res.ok) {
    throw new Error(
      `メンテナンス履歴登録失敗: ${res.status} ${await res.text()}`
    )
  }
  const json = (await res.json()) as { data: { maintenanceLogId: string } }
  return json.data.maintenanceLogId
}
