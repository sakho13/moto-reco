import { prisma } from '@repo/database'
import { app } from '@/lib/api/server/app'

/**
 * シードデータからbikeIdを取得する
 */
export async function getTestBikeId(): Promise<string> {
  const bike = await prisma.mBike.findFirst({ select: { id: true } })
  if (!bike) {
    throw new Error('事前にバイクのシードデータを投入してください')
  }
  return bike.id
}

/**
 * テスト用バイクを登録する
 */
export async function createTestUserBike(
  token: string,
  options?: {
    bikeId?: string
    serialNumber?: string
    nickname?: string
    displacement?: number
    purchaseDate?: string
    purchasePrice?: number
    purchaseMileage?: number
    totalMileage?: number
  }
): Promise<{
  userBikeId: string
  myUserBikeId: string
}> {
  const res = await app.request('/api/v1/user-bike/register', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options || {}),
  })

  const json = await res.json()
  return {
    userBikeId: json.data.userBikeId,
    myUserBikeId: json.data.myUserBikeId,
  }
}
