import { beforeEach, describe, expect, test } from 'vitest'
import { createTestUser, testAuthRequired } from '../../helpers/authHelper'
import { createTestUserBike } from '../../helpers/bikeHelper'
import { createTestMaintenanceLog } from '../../helpers/maintenanceLogHelper'
import {
  expect404Error,
  expectValidationError,
} from '../../helpers/validationHelper'
import { app } from '@/lib/api/server/app'

describe('Maintenance Log API Endpoints', () => {
  let token: string
  let myUserBikeId: string

  beforeEach(async () => {
    const user = await createTestUser()
    token = user.token

    const bike = await createTestUserBike(token, {
      displacement: 400,
      serialNumber: 'TEST-MAINTENANCE-LOG',
      nickname: 'メンテナンス用バイク',
      totalMileage: 10000,
    })
    myUserBikeId = bike.myUserBikeId
  })

  describe('POST /api/v1/user-bike/bike/:myUserBikeId/maintenance-logs', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
        'POST',
        {
          performedAt: new Date().toISOString(),
          mileage: 12000,
          items: [
            {
              maintenanceType: 'ENGINE_OIL',
              value: 1,
            },
          ],
        }
      )
    })

    test('バリデーションエラーが発生した場合にエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            performedAt: 'invalid-date',
            mileage: -1,
            items: [],
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('存在しないmyUserBikeIdを指定した場合にエラーとなる', async () => {
      const res = await app.request(
        '/api/v1/user-bike/bike/invalid-id/maintenance-logs',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            performedAt: new Date().toISOString(),
            mileage: 12000,
            items: [
              {
                maintenanceType: 'ENGINE_OIL',
                value: 1,
              },
            ],
          }),
        }
      )

      const json = await res.json()
      expect404Error(json)
      expect(json.message).toBe('指定されたバイクが見つかりません')
    })

    test('メンテナンス履歴を登録できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            performedAt: new Date().toISOString(),
            mileage: 12000,
            memo: 'オイル交換',
            items: [
              {
                maintenanceType: 'ENGINE_OIL',
                value: 1,
              },
              {
                maintenanceType: 'OIL_CLEANER',
                value: 1,
              },
            ],
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.message).toBe('メンテナンス履歴登録成功')
      expect(json.data.maintenanceLogId).toBeDefined()
      expect(json.data.items).toHaveLength(2)
    })
  })

  describe('PATCH /api/v1/user-bike/bike/:myUserBikeId/maintenance-logs', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
        'PATCH',
        {
          maintenanceLogId: 'log-id',
          memo: '更新メモ',
        }
      )
    })

    test('存在しないメンテナンス履歴を指定した場合にエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            maintenanceLogId: 'invalid-log-id',
            memo: '更新メモ',
          }),
        }
      )

      const json = await res.json()
      expect404Error(json)
      expect(json.message).toBe('指定されたメンテナンス履歴が見つかりません')
    })

    test('メンテナンス履歴を更新できる', async () => {
      const maintenanceLogId = await createTestMaintenanceLog(
        token,
        myUserBikeId,
        {
          performedAt: new Date().toISOString(),
          mileage: 12000,
          memo: '初回整備',
          items: [
            {
              maintenanceType: 'ENGINE_OIL',
              value: 1,
            },
          ],
        }
      )

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            maintenanceLogId,
            mileage: 13000,
            memo: 'オイルとチェーン交換',
            items: [
              {
                maintenanceType: 'ENGINE_OIL',
                value: 1,
              },
              {
                maintenanceType: 'DRIVE_CHAIN',
                value: 1,
              },
            ],
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.message).toBe('メンテナンス履歴更新成功')
      expect(json.data.mileage).toBe(13000)
      expect(json.data.items).toHaveLength(2)
    })

    test('バリデーションエラーが発生した場合にエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            maintenanceLogId: 'log-id',
            items: [],
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })
  })
})
