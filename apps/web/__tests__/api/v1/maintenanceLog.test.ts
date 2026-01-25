import { beforeEach, describe, expect, test } from 'vitest'
import { createTestUser, testAuthRequired } from '../../helpers/authHelper'
import { createTestUserBike } from '../../helpers/bikeHelper'
import { expect404Error, expectValidationError } from '../../helpers/validationHelper'
import { app } from '@/lib/api/server/app'

describe('Maintenance Log API Endpoints', () => {
  let token: string
  let myUserBikeId: string

  beforeEach(async () => {
    const user = await createTestUser()
    token = user.token

    const bike = await createTestUserBike(token, {
      displacement: 400,
      nickname: 'メンテナンス履歴テストバイク',
      totalMileage: 10000,
    })
    myUserBikeId = bike.myUserBikeId
  })

  test('Authorizationヘッダーが未指定の場合に登録でエラーとなる', async () => {
    await testAuthRequired(
      `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
      'POST',
      {
        performedAt: '2025-01-01T10:00:00.000Z',
        mileage: 12000,
        items: [{ type: 'ENGINE_OIL', value: '交換' }],
      }
    )
  })

  test('Authorizationヘッダーが未指定の場合に更新でエラーとなる', async () => {
    await testAuthRequired(
      `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
      'PATCH',
      {
        maintenanceLogId: 'maintenance-log-id',
        memo: '更新',
      }
    )
  })

  test('メンテナンス項目が空の場合に登録でエラーとなる', async () => {
    const res = await app.request(
      `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          performedAt: '2025-01-01T10:00:00.000Z',
          mileage: 12000,
          items: [],
        }),
      }
    )

    const json = await res.json()
    expect(res.status).toBe(400)
    expectValidationError(json)
  })

  test('存在しないmyUserBikeIdで登録した場合にエラーとなる', async () => {
    const res = await app.request(
      '/api/v1/user-bike/bike/invalid-id/maintenance-logs',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          performedAt: '2025-01-01T10:00:00.000Z',
          mileage: 12000,
          items: [{ type: 'ENGINE_OIL', value: '交換' }],
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
          performedAt: '2025-01-01T10:00:00.000Z',
          mileage: 12000,
          memo: '定期点検',
          items: [
            { type: 'ENGINE_OIL', value: '交換' },
            { type: 'BRAKE_FLUID', value: '補充' },
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

  test('メンテナンス履歴を更新できる', async () => {
    const registerRes = await app.request(
      `/api/v1/user-bike/bike/${myUserBikeId}/maintenance-logs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          performedAt: '2025-01-01T10:00:00.000Z',
          mileage: 12000,
          items: [{ type: 'ENGINE_OIL', value: '交換' }],
        }),
      }
    )

    const registerJson = await registerRes.json()
    const maintenanceLogId = registerJson.data.maintenanceLogId

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
          memo: '更新メモ',
          items: [{ type: 'BRAKE_FLUID', value: '交換' }],
        }),
      }
    )

    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.message).toBe('メンテナンス履歴更新成功')
    expect(json.data.memo).toBe('更新メモ')
    expect(json.data.items).toHaveLength(1)
    expect(json.data.items[0].type).toBe('BRAKE_FLUID')
  })

  test('存在しないメンテナンス履歴IDで更新した場合にエラーとなる', async () => {
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
          memo: '更新',
        }),
      }
    )

    const json = await res.json()
    expect404Error(json)
    expect(json.message).toBe('指定されたメンテナンス履歴が見つかりません')
  })
})
