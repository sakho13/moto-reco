import { randomUUID } from 'crypto'
import { beforeEach, describe, expect, test } from 'vitest'
import { createTestUser, testAuthRequired } from '../../helpers/authHelper'
import { createTestUserBike } from '../../helpers/bikeHelper'
import { createTestMaintenanceLog } from '../../helpers/maintenanceLogHelper'
import {
  expect404Error,
  expectValidationError,
} from '../../helpers/validationHelper'
import { app } from '@/lib/api/server/app'

describe('Maintenance Schedule API Endpoints', () => {
  let token: string
  let myUserBikeId: string

  beforeEach(async () => {
    const user = await createTestUser()
    token = user.token

    const bike = await createTestUserBike(token, {
      displacement: 400,
      serialNumber: 'TEST-MAINTENANCE-SCHEDULE',
      nickname: '点検予定用バイク',
      totalMileage: 10000,
    })
    myUserBikeId = bike.myUserBikeId
  })

  describe('GET /api/v1/user-bike/bike/:myUserBikeId/maintenance-schedule', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-schedule`,
        'GET'
      )
    })

    test('存在しないバイクIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${randomUUID()}/maintenance-schedule`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('他のユーザーのバイクの点検予定を取得しようとすると404となる', async () => {
      const otherUser = await createTestUser()

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-schedule`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${otherUser.token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('整備記録が1件も無い場合、全項目が記録なし(NO_RECORD)として返る', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-schedule`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.message).toBe('点検予定取得成功')
      expect(Array.isArray(json.data)).toBe(true)
      // メンテナンス項目マスタは19項目
      expect(json.data.length).toBe(19)
      for (const item of json.data) {
        expect(item.status).toBe('NO_RECORD')
        expect(item.basis).toBeNull()
        expect(item.remainingMileage).toBeNull()
        expect(item.dueDate).toBeNull()
        expect(item.remainingDays).toBeNull()
        expect(item.lastRecord).toBeNull()
      }
    })

    test('整備記録がある項目は、残りが少ない順に記録なしの項目より前に並ぶ', async () => {
      // ENGINE_OIL: 進捗率 (10000-8500)/3000 = 0.5 (走行距離基準採用時)
      await createTestMaintenanceLog(token, myUserBikeId, {
        performedAt: '2024-01-01T00:00:00.000Z',
        mileage: 8500,
        items: [{ maintenanceType: 'ENGINE_OIL', value: 1 }],
      })
      // DRIVE_CHAIN: 進捗率 (10000-9000)/20000 = 0.05
      await createTestMaintenanceLog(token, myUserBikeId, {
        performedAt: '2024-01-01T00:00:00.000Z',
        mileage: 9000,
        items: [{ maintenanceType: 'DRIVE_CHAIN', value: 1 }],
      })

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-schedule`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)

      type ScheduleItem = { type: string; status: string }
      const types = (json.data as ScheduleItem[]).map((d) => d.type)
      const statuses = (json.data as ScheduleItem[]).map((d) => d.status)

      const engineOilIndex = types.indexOf('ENGINE_OIL')
      const driveChainIndex = types.indexOf('DRIVE_CHAIN')
      const firstNoRecordIndex = statuses.indexOf('NO_RECORD')

      expect(engineOilIndex).toBeGreaterThanOrEqual(0)
      expect(driveChainIndex).toBeGreaterThanOrEqual(0)
      expect(firstNoRecordIndex).toBeGreaterThanOrEqual(0)
      // ENGINE_OILの方が進捗率が高い（残りが少ない）ため先に並ぶ
      expect(engineOilIndex).toBeLessThan(driveChainIndex)
      // 記録が無い項目は、記録がある項目より後ろに並ぶ
      expect(driveChainIndex).toBeLessThan(firstNoRecordIndex)
    })

    test('limitクエリで上位N件に絞り込める', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-schedule?limit=3`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.length).toBe(3)
    })

    test('limitが不正な値の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-schedule?limit=0`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('limitがマスタ項目数を超える場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-schedule?limit=100`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })
  })
})
