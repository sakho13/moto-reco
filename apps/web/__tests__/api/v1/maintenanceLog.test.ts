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

  describe('GET /api/v1/user-bike/bike/:myUserBikeId/maintenance-logs', () => {
    beforeEach(async () => {
      await createTestMaintenanceLog(token, myUserBikeId, {
        performedAt: '2024-01-01T10:00:00.000Z',
        mileage: 10500,
        memo: 'エンジンオイル交換',
        items: [{ maintenanceType: 'ENGINE_OIL', value: 1 }],
      })
      await createTestMaintenanceLog(token, myUserBikeId, {
        performedAt: '2024-02-01T10:00:00.000Z',
        mileage: 11000,
        memo: 'チェーン注油',
        items: [{ maintenanceType: 'DRIVE_CHAIN', value: 1 }],
      })
      await createTestMaintenanceLog(token, myUserBikeId, {
        performedAt: '2024-03-01T10:00:00.000Z',
        mileage: 11500,
        items: [{ maintenanceType: 'FRONT_TIRE', value: 1 }],
      })
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
        'GET'
      )
    })

    test('存在しないバイクIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${randomUUID()}/maintenance-logs`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('メンテナンス履歴一覧を取得できる（デフォルトパラメータ）', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.message).toBe('メンテナンス履歴一覧取得成功')
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(3)
      expect(json.data[0].performedAt).toBe('2024-03-01T10:00:00.000Z')
      expect(json.data[2].performedAt).toBe('2024-01-01T10:00:00.000Z')
    })

    test('メンテナンス履歴が0件の場合は空配列を返す', async () => {
      const bike = await createTestUserBike(token, {
        displacement: 125,
        nickname: 'メンテナンス履歴なしバイク',
        totalMileage: 100,
      })

      const res = await app.request(
        `/api/v1/user-bike/bike/${bike.myUserBikeId}/maintenance-logs`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toEqual([])
    })

    describe('キーワード検索機能', () => {
      test('メモの部分一致でメンテナンス履歴を検索できる', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs?keyword=${encodeURIComponent('オイル')}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        const json = await res.json()
        expect(res.status).toBe(200)
        expect(json.data.length).toBe(1)
        expect(json.data[0].memo).toBe('エンジンオイル交換')
      })

      test('大文字小文字を区別せず検索できる', async () => {
        await createTestMaintenanceLog(token, myUserBikeId, {
          performedAt: '2024-04-01T10:00:00.000Z',
          mileage: 12000,
          memo: 'REAR SHOCK点検',
          items: [{ maintenanceType: 'LIGHT', value: null }],
        })

        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs?keyword=${encodeURIComponent('rear shock')}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        const json = await res.json()
        expect(res.status).toBe(200)
        expect(json.data.length).toBe(1)
        expect(json.data[0].memo).toBe('REAR SHOCK点検')
      })

      test('前後の空白はトリムされて検索される', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs?keyword=${encodeURIComponent('  オイル  ')}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        const json = await res.json()
        expect(res.status).toBe(200)
        expect(json.data.length).toBe(1)
      })

      test('該当データがない場合は空配列を返す', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs?keyword=${encodeURIComponent('存在しないキーワード')}`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        const json = await res.json()
        expect(res.status).toBe(200)
        expect(json.data).toEqual([])
      })

      test('既存のページネーション・ソートと併用できる', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs?keyword=${encodeURIComponent('注油')}&sort-order=asc&page=1&per-size=10`,
          {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        const json = await res.json()
        expect(res.status).toBe(200)
        expect(json.data.length).toBe(1)
        expect(json.data[0].memo).toBe('チェーン注油')
      })
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

  describe('FREEユーザーのメンテナンス履歴制限（5件まで）', () => {
    test('FREEユーザーは5件まで登録できる', async () => {
      const user = await createTestUser()
      const { myUserBikeId: bikeId } = await createTestUserBike(user.token, {
        displacement: 400,
        totalMileage: 0,
      })

      for (let i = 1; i <= 5; i++) {
        const res = await app.request(
          `/api/v1/user-bike/bike/${bikeId}/maintenance-logs`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              performedAt: `2024-01-${String(i).padStart(2, '0')}T10:00:00.000Z`,
              mileage: i * 1000,
              items: [{ maintenanceType: 'ENGINE_OIL', value: 1 }],
            }),
          }
        )
        expect(res.status).toBe(201)
      }
    })

    test('FREEユーザーは6件目のメンテナンス履歴を登録できない', async () => {
      const user = await createTestUser()
      const { myUserBikeId: bikeId } = await createTestUserBike(user.token, {
        displacement: 400,
        totalMileage: 0,
      })

      for (let i = 1; i <= 5; i++) {
        await createTestMaintenanceLog(user.token, bikeId, {
          performedAt: `2024-01-${String(i).padStart(2, '0')}T10:00:00.000Z`,
          mileage: i * 1000,
          items: [{ maintenanceType: 'ENGINE_OIL', value: 1 }],
        })
      }

      const res = await app.request(
        `/api/v1/user-bike/bike/${bikeId}/maintenance-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            performedAt: '2024-01-06T10:00:00.000Z',
            mileage: 6000,
            items: [{ maintenanceType: 'ENGINE_OIL', value: 1 }],
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json).toMatchObject({
        status: 'error',
        errorCode: 'INVALID_REQUEST',
        message: '無料ユーザーはメンテナンス履歴を5件まで登録できます',
      })
    })
  })
})
