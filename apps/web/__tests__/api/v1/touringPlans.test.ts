import { randomUUID } from 'crypto'
import { beforeEach, describe, expect, test } from 'vitest'
import { createTestUser, testAuthRequired } from '../../helpers/authHelper'
import { createTestUserBike } from '../../helpers/bikeHelper'
import {
  expectValidationError,
  expect404Error,
} from '../../helpers/validationHelper'
import { app } from '@/lib/api/server/app'

describe('TouringPlans API Endpoints', () => {
  describe('GET /api/v1/user-bike/bike/:myUserBikeId/touring-plans', () => {
    let token: string
    let myUserBikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: 'プラン一覧テスト用バイク',
      })
      myUserBikeId = bike.myUserBikeId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        'GET'
      )
    })

    test('プランが存在しない場合は空配列を返す', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toEqual([])
      expect(json.message).toBe('ツーリングプラン一覧取得成功')
    })

    test('複数のプランを作成日時の降順で取得できる', async () => {
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '先に作成したプラン',
          }),
        }
      )

      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '後に作成したプラン',
            destinationLocation: {
              latitude: 35.1,
              longitude: 136.9,
              name: '目的地A',
            },
          }),
        }
      )

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toHaveLength(2)
      // createdAt降順のため、後に作成したプランが先頭になる
      expect(json.data[0].title).toBe('後に作成したプラン')
      expect(json.data[1].title).toBe('先に作成したプラン')
      expect(json.data[0].destination).toMatchObject({
        name: '目的地A',
      })
      expect(json.data[1].destination).toBeNull()
    })
  })

  describe('POST /api/v1/user-bike/bike/:myUserBikeId/touring-plans', () => {
    let token: string
    let myUserBikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: 'プラン登録テスト用バイク',
      })
      myUserBikeId = bike.myUserBikeId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        'POST',
        {
          title: 'テストプラン',
        }
      )
    })

    test('titleが未指定の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('出発地・目的地を指定せずにプランを登録できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '最小構成プラン',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json).toMatchObject({
        status: 'success',
        message: 'ツーリングプラン登録成功',
        data: {
          title: '最小構成プラン',
          startLocation: null,
          destinationLocation: null,
          touringIds: [],
        },
      })
      expect(typeof json.data.touringPlanId).toBe('string')
      expect(typeof json.data.createdAt).toBe('string')
      expect(typeof json.data.updatedAt).toBe('string')
    })

    test('出発地・目的地を指定してプランを登録できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '出発地目的地ありプラン',
            startLocation: {
              latitude: 35.0,
              longitude: 136.0,
              name: '出発地',
            },
            destinationLocation: {
              latitude: 35.5,
              longitude: 137.0,
              name: '目的地',
              travelMinutesFromPrev: 360,
              routeTypeFromPrev: 'HIGHWAY',
            },
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.startLocation).toMatchObject({
        latitude: 35.0,
        longitude: 136.0,
        name: '出発地',
        memo: null,
      })
      expect(json.data.destinationLocation).toMatchObject({
        latitude: 35.5,
        longitude: 137.0,
        name: '目的地',
        memo: null,
        travelMinutesFromPrev: 360,
        routeTypeFromPrev: 'HIGHWAY',
      })
      expect(typeof json.data.startLocation.touringPlanSpotId).toBe('string')
      expect(typeof json.data.destinationLocation.touringPlanSpotId).toBe(
        'string'
      )

      // 再取得すると、予定到着・出発時刻が再計算されて反映されている
      const detailRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${json.data.touringPlanId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const detailJson = await detailRes.json()
      // plannedDepartureOffsetMinutesは出発(START)を0分とした経過分数
      expect(detailJson.data.startLocation).toMatchObject({
        plannedArrivalOffsetMinutes: null,
        plannedDepartureOffsetMinutes: 0,
      })
      // plannedArrivalOffsetMinutesは出発から移動時間(6時間=360分)後
      expect(detailJson.data.destinationLocation).toMatchObject({
        plannedArrivalOffsetMinutes: 360,
        plannedDepartureOffsetMinutes: null,
      })
    })

    test('存在しないmyUserBikeIdを指定した場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${randomUUID()}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'テストプラン',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })
  })

  describe('GET /api/v1/user-bike/bike/:myUserBikeId/touring-plans/:planId', () => {
    let token: string
    let myUserBikeId: string
    let touringPlanId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: 'プラン取得テスト用バイク',
      })
      myUserBikeId = bike.myUserBikeId

      const planRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '詳細取得テストプラン',
          }),
        }
      )
      const planJson = await planRes.json()
      touringPlanId = planJson.data.touringPlanId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        'GET'
      )
    })

    test('プラン詳細を取得できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json).toMatchObject({
        status: 'success',
        message: 'ツーリングプラン取得成功',
        data: {
          touringPlanId,
          title: '詳細取得テストプラン',
          startLocation: null,
          destinationLocation: null,
          touringIds: [],
        },
      })
      expect(typeof json.data.createdAt).toBe('string')
      expect(typeof json.data.updatedAt).toBe('string')
    })

    test('存在しないplanIdを指定した場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${randomUUID()}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('開始されたツーリングのIDがtouringIdsに含まれる', async () => {
      const startRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'start',
            touringPlanId,
            startDate: '2024-07-01T06:00:00.000Z',
          }),
        }
      )
      const startJson = await startRes.json()
      expect(startRes.status).toBe(201)

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.touringIds).toEqual([startJson.data.touringId])
    })
  })

  describe('PATCH /api/v1/user-bike/bike/:myUserBikeId/touring-plans/:planId', () => {
    let token: string
    let myUserBikeId: string
    let touringPlanId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: 'プラン更新テスト用バイク',
      })
      myUserBikeId = bike.myUserBikeId

      const planRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '更新前プラン',
          }),
        }
      )
      const planJson = await planRes.json()
      touringPlanId = planJson.data.touringPlanId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        'PATCH',
        { title: '更新後プラン' }
      )
    })

    test('更新項目が未指定の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('titleのみを更新できる', async () => {
      const beforeRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const beforeJson = await beforeRes.json()

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: '更新後プラン' }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.title).toBe('更新後プラン')
      // createdAtは変更されない
      expect(json.data.createdAt).toBe(beforeJson.data.createdAt)
      // updatedAtは更新される
      expect(typeof json.data.updatedAt).toBe('string')
      expect(new Date(json.data.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeJson.data.updatedAt).getTime()
      )
    })

    test('存在しないplanIdを指定した場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${randomUUID()}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: '更新後プラン' }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })
  })

  describe('DELETE /api/v1/user-bike/bike/:myUserBikeId/touring-plans/:planId', () => {
    let token: string
    let myUserBikeId: string
    let touringPlanId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: 'プラン削除テスト用バイク',
      })
      myUserBikeId = bike.myUserBikeId

      const planRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '削除対象プラン',
          }),
        }
      )
      const planJson = await planRes.json()
      touringPlanId = planJson.data.touringPlanId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        'DELETE'
      )
    })

    test('プランを削除できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.message).toBe('ツーリングプラン削除成功')

      // 削除後は取得できない
      const getRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      expect(getRes.status).toBe(404)
    })

    test('存在しないplanIdを指定した場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${randomUUID()}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })
  })

  describe('PATCH /api/v1/user-bike/bike/:myUserBikeId/touring-plans/:planId/start-location', () => {
    let token: string
    let myUserBikeId: string
    let touringPlanId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: '出発地設定テスト用バイク',
      })
      myUserBikeId = bike.myUserBikeId

      const planRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '出発地設定テストプラン',
          }),
        }
      )
      const planJson = await planRes.json()
      touringPlanId = planJson.data.touringPlanId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
        'PATCH',
        { latitude: 35.0, longitude: 136.0 }
      )
    })

    test('出発地を設定できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 35.0,
            longitude: 136.0,
            name: '出発地',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.message).toBe('出発地設定成功')
      expect(json.data).toMatchObject({
        latitude: 35.0,
        longitude: 136.0,
        name: '出発地',
        memo: null,
      })

      // 再取得すると、予定出発までの経過分数が0分（出発時）で反映されている
      const detailRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const detailJson = await detailRes.json()
      expect(detailJson.data.startLocation).toMatchObject({
        plannedArrivalOffsetMinutes: null,
        plannedDepartureOffsetMinutes: 0,
      })
    })

    test('出発地を更新できる', async () => {
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 35.0,
            longitude: 136.0,
            name: '出発地A',
          }),
        }
      )

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 36.0,
            longitude: 137.0,
            name: '出発地B',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toMatchObject({
        latitude: 36.0,
        longitude: 137.0,
        name: '出発地B',
      })

      // プラン詳細でも反映されていることを確認
      const detailRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const detailJson = await detailRes.json()
      expect(detailJson.data.startLocation).toMatchObject({
        latitude: 36.0,
        longitude: 137.0,
        name: '出発地B',
      })
    })

    test('nullを指定すると出発地を解除できる', async () => {
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 35.0,
            longitude: 136.0,
            name: '出発地',
          }),
        }
      )

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(null),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toBeNull()

      const detailRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const detailJson = await detailRes.json()
      expect(detailJson.data.startLocation).toBeNull()
    })

    test('緯度が範囲外の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 100,
            longitude: 136.0,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })
  })

  describe('PATCH /api/v1/user-bike/bike/:myUserBikeId/touring-plans/:planId/destination-location', () => {
    let token: string
    let myUserBikeId: string
    let touringPlanId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: '目的地設定テスト用バイク',
      })
      myUserBikeId = bike.myUserBikeId

      const planRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '目的地設定テストプラン',
          }),
        }
      )
      const planJson = await planRes.json()
      touringPlanId = planJson.data.touringPlanId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/destination-location`,
        'PATCH',
        { latitude: 35.5, longitude: 137.0 }
      )
    })

    test('目的地を設定でき、到着予定までの経過分数が反映される', async () => {
      // 出発地を設定（移動時間の起点となる）
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 35.0,
            longitude: 136.0,
            name: '出発地',
          }),
        }
      )

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/destination-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 35.5,
            longitude: 137.0,
            name: '目的地',
            travelMinutesFromPrev: 720,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.message).toBe('目的地設定成功')
      expect(json.data).toMatchObject({
        latitude: 35.5,
        longitude: 137.0,
        name: '目的地',
        memo: null,
        travelMinutesFromPrev: 720,
      })

      // 再取得すると、予定到着までの経過分数が移動時間(12時間=720分)で反映されている
      const spotDetailRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const spotDetailJson = await spotDetailRes.json()
      expect(spotDetailJson.data.destinationLocation).toMatchObject({
        plannedArrivalOffsetMinutes: 720,
        plannedDepartureOffsetMinutes: null,
      })
    })

    test('nullを指定すると目的地を解除できる', async () => {
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/destination-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 35.5,
            longitude: 137.0,
            name: '目的地',
            travelMinutesFromPrev: 720,
          }),
        }
      )

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/destination-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(null),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toBeNull()

      const detailRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const detailJson = await detailRes.json()
      expect(detailJson.data.destinationLocation).toBeNull()
    })

    test('経度が範囲外の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/destination-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 35.5,
            longitude: 200,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })
  })

  describe('GET /api/v1/user-bike/bike/:myUserBikeId/touring-plans/:planId/spots', () => {
    let token: string
    let myUserBikeId: string
    let touringPlanId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: 'スポット一覧テスト用バイク',
      })
      myUserBikeId = bike.myUserBikeId

      const planRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'スポット一覧テストプラン',
            startLocation: {
              latitude: 35.0,
              longitude: 136.0,
              name: '出発地',
            },
            destinationLocation: {
              latitude: 35.5,
              longitude: 137.0,
              name: '目的地',
            },
          }),
        }
      )
      const planJson = await planRes.json()
      touringPlanId = planJson.data.touringPlanId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        'GET'
      )
    })

    test('出発地・経由地・休憩・目的地が統合された順序で取得できる', async () => {
      // 経由地を追加
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'SPOT',
            name: '経由地A',
          }),
        }
      )

      // 休憩を追加
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'BREAK',
            name: '休憩B',
          }),
        }
      )

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.message).toBe('ツーリングプランスポット一覧取得成功')
      expect(json.data).toHaveLength(4)
      expect(json.data.map((s: { type: string }) => s.type)).toEqual([
        'START',
        'SPOT',
        'BREAK',
        'DESTINATION',
      ])
      expect(json.data[0].name).toBe('出発地')
      expect(json.data[1].name).toBe('経由地A')
      expect(json.data[2].name).toBe('休憩B')
      expect(json.data[3].name).toBe('目的地')
    })

    test('出発地・目的地未設定の場合は経由地のみ返す', async () => {
      const newPlanRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '出発地目的地なしプラン',
          }),
        }
      )
      const newPlanJson = await newPlanRes.json()
      const newPlanId = newPlanJson.data.touringPlanId

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${newPlanId}/spots`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toEqual([])
    })
  })

  describe('POST /api/v1/user-bike/bike/:myUserBikeId/touring-plans/:planId/spots', () => {
    let token: string
    let myUserBikeId: string
    let touringPlanId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: 'スポット登録テスト用バイク',
      })
      myUserBikeId = bike.myUserBikeId

      const planRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'スポット登録テストプラン',
          }),
        }
      )
      const planJson = await planRes.json()
      touringPlanId = planJson.data.touringPlanId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        'POST',
        { type: 'SPOT', name: '経由地A' }
      )
    })

    test('typeが未指定の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: '経由地A' }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('travelMinutesFromPrevが範囲外の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'BREAK',
            name: '休憩',
            travelMinutesFromPrev: -1,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('経由地（SPOT）を登録できる', async () => {
      // 出発地を設定（移動時間の起点となる）
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 35.0,
            longitude: 136.0,
            name: '出発地',
          }),
        }
      )

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'SPOT',
            name: '経由地A',
            memo: 'メモA',
            latitude: 35.2,
            longitude: 136.5,
            stayMinutes: 15,
            travelMinutesFromPrev: 180,
            routeTypeFromPrev: 'GENERAL',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.message).toBe('ツーリングプランスポット登録成功')
      expect(json.data).toMatchObject({
        touringPlanId,
        type: 'SPOT',
        name: '経由地A',
        memo: 'メモA',
        latitude: 35.2,
        longitude: 136.5,
        stayMinutes: 15,
        travelMinutesFromPrev: 180,
        routeTypeFromPrev: 'GENERAL',
        sortOrder: 0,
      })
      expect(typeof json.data.touringPlanSpotId).toBe('string')

      // 再取得すると、予定到着・出発時刻が再計算されて反映されている
      const spotsRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const spotsJson = await spotsRes.json()
      const registeredSpot = spotsJson.data.find(
        (s: { touringPlanSpotId: string }) =>
          s.touringPlanSpotId === json.data.touringPlanSpotId
      )
      expect(registeredSpot).toMatchObject({
        // plannedArrivalOffsetMinutesは出発から移動時間(3時間=180分)後
        plannedArrivalOffsetMinutes: 180,
        // plannedDepartureOffsetMinutesはplannedArrivalOffsetMinutes(180分) + 滞在時間(15分) = 195分
        plannedDepartureOffsetMinutes: 195,
      })
    })

    test('休憩（BREAK）を登録できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'BREAK',
            name: '休憩ポイント',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.type).toBe('BREAK')
      expect(json.data.name).toBe('休憩ポイント')
    })

    test('複数登録した場合、sortOrderが連番で採番される', async () => {
      const res1 = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'SPOT', name: '経由地A' }),
        }
      )
      const json1 = await res1.json()

      const res2 = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'BREAK', name: '休憩B' }),
        }
      )
      const json2 = await res2.json()

      expect(json1.data.sortOrder).toBe(0)
      expect(json2.data.sortOrder).toBe(1)
    })

    test('travelMinutesFromPrev・stayMinutesを指定した場合、後続スポットのplannedArrivalOffsetMinutes/plannedDepartureOffsetMinutesが再計算される', async () => {
      // 出発地を設定（移動時間の起点となる）
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 35.0,
            longitude: 136.0,
            name: '出発地',
          }),
        }
      )

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'BREAK',
            name: '休憩ポイント',
            travelMinutesFromPrev: 180,
            stayMinutes: 30,
          }),
        }
      )
      expect(res.status).toBe(201)

      // 後続スポットを追加（休憩ポイントからさらに移動）
      const nextRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'SPOT',
            name: '経由地B',
            travelMinutesFromPrev: 60,
          }),
        }
      )
      const nextJson = await nextRes.json()
      expect(nextRes.status).toBe(201)

      const spotsRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const spotsJson = await spotsRes.json()
      const nextSpot = spotsJson.data.find(
        (s: { touringPlanSpotId: string }) =>
          s.touringPlanSpotId === nextJson.data.touringPlanSpotId
      )
      // 休憩ポイントの出発予定 = 移動時間(3h=180分) + 滞在時間(30分) = 出発から210分後
      // 経由地Bの到着予定 = 休憩ポイントの出発予定(210分後) + 移動時間(1h=60分) = 出発から270分後
      expect(nextSpot).toMatchObject({
        plannedArrivalOffsetMinutes: 270,
        plannedDepartureOffsetMinutes: 270,
      })
    })

    test('存在しないplanIdを指定した場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${randomUUID()}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'SPOT', name: '経由地A' }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })
  })

  describe('PATCH /api/v1/user-bike/bike/:myUserBikeId/touring-plans/:planId/spots/reorder', () => {
    let token: string
    let myUserBikeId: string
    let touringPlanId: string
    let spotIdA: string
    let spotIdB: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: '並び替えテスト用バイク',
      })
      myUserBikeId = bike.myUserBikeId

      const planRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '並び替えテストプラン',
          }),
        }
      )
      const planJson = await planRes.json()
      touringPlanId = planJson.data.touringPlanId

      const spotARes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'SPOT', name: '経由地A' }),
        }
      )
      const spotAJson = await spotARes.json()
      spotIdA = spotAJson.data.touringPlanSpotId

      const spotBRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'BREAK', name: '休憩B' }),
        }
      )
      const spotBJson = await spotBRes.json()
      spotIdB = spotBJson.data.touringPlanSpotId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/reorder`,
        'PATCH',
        { spotIds: [] }
      )
    })

    test('spotIdsが空配列の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/reorder`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ spotIds: [] }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('経由地・休憩の並び順を変更できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/reorder`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ spotIds: [spotIdB, spotIdA] }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.message).toBe('ツーリングプランスポット並び替え成功')

      const spotsRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const spotsJson = await spotsRes.json()
      expect(
        spotsJson.data.map(
          (s: { touringPlanSpotId: string }) => s.touringPlanSpotId
        )
      ).toEqual([spotIdB, spotIdA])
    })
  })

  describe('PATCH /api/v1/user-bike/bike/:myUserBikeId/touring-plans/:planId/spots/:spotId', () => {
    let token: string
    let myUserBikeId: string
    let touringPlanId: string
    let spotId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: 'スポット更新テスト用バイク',
      })
      myUserBikeId = bike.myUserBikeId

      const planRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'スポット更新テストプラン',
          }),
        }
      )
      const planJson = await planRes.json()
      touringPlanId = planJson.data.touringPlanId

      const spotRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'SPOT',
            name: '更新前経由地',
          }),
        }
      )
      const spotJson = await spotRes.json()
      spotId = spotJson.data.touringPlanSpotId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/${spotId}`,
        'PATCH',
        { name: '更新後経由地' }
      )
    })

    test('更新項目が未指定の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/${spotId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('name・memo・座標・移動時間・滞在時間を更新できる', async () => {
      // 出発地を設定（移動時間の起点となる）
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 35.0,
            longitude: 136.0,
            name: '出発地',
          }),
        }
      )

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/${spotId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: '更新後経由地',
            memo: '更新後メモ',
            latitude: 36.0,
            longitude: 138.0,
            stayMinutes: 30,
            travelMinutesFromPrev: 240,
            routeTypeFromPrev: 'MIXED',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.message).toBe('ツーリングプランスポット更新成功')
      expect(json.data).toMatchObject({
        touringPlanSpotId: spotId,
        name: '更新後経由地',
        memo: '更新後メモ',
        latitude: 36.0,
        longitude: 138.0,
        stayMinutes: 30,
        travelMinutesFromPrev: 240,
        routeTypeFromPrev: 'MIXED',
      })

      // 再取得すると、予定到着・出発時刻が再計算されて反映されている
      const spotsRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const spotsJson = await spotsRes.json()
      const updatedSpot = spotsJson.data.find(
        (s: { touringPlanSpotId: string }) => s.touringPlanSpotId === spotId
      )
      expect(updatedSpot).toMatchObject({
        // plannedArrivalOffsetMinutesは出発から移動時間(4h=240分)後
        plannedArrivalOffsetMinutes: 240,
        // plannedDepartureOffsetMinutesはplannedArrivalOffsetMinutes(240分) + 滞在時間(30分) = 270分
        plannedDepartureOffsetMinutes: 270,
      })
    })

    test('travelMinutesFromPrev・stayMinutesを更新すると、plannedArrivalOffsetMinutes/plannedDepartureOffsetMinutesが再計算される', async () => {
      // 出発地を設定（移動時間の起点となる）
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/start-location`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 35.0,
            longitude: 136.0,
            name: '出発地',
          }),
        }
      )

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/${spotId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            travelMinutesFromPrev: 180,
            stayMinutes: 45,
          }),
        }
      )
      expect(res.status).toBe(200)

      const spotsRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const spotsJson = await spotsRes.json()
      const updatedSpot = spotsJson.data.find(
        (s: { touringPlanSpotId: string }) => s.touringPlanSpotId === spotId
      )
      // plannedArrivalOffsetMinutes = 出発から移動時間(3h=180分)後
      // plannedDepartureOffsetMinutes = plannedArrivalOffsetMinutes(180分) + 滞在時間(45分) = 225分
      expect(updatedSpot).toMatchObject({
        plannedArrivalOffsetMinutes: 180,
        plannedDepartureOffsetMinutes: 225,
      })
    })

    test('travelMinutesFromPrevが範囲外の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/${spotId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            travelMinutesFromPrev: 1441,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('存在しないspotIdを指定した場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/${randomUUID()}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: '更新後経由地' }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })
  })

  describe('DELETE /api/v1/user-bike/bike/:myUserBikeId/touring-plans/:planId/spots/:spotId', () => {
    let token: string
    let myUserBikeId: string
    let touringPlanId: string
    let spotId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: 'スポット削除テスト用バイク',
      })
      myUserBikeId = bike.myUserBikeId

      const planRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'スポット削除テストプラン',
          }),
        }
      )
      const planJson = await planRes.json()
      touringPlanId = planJson.data.touringPlanId

      const spotRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'BREAK',
            name: '削除対象休憩',
            travelMinutesFromPrev: 180,
            stayMinutes: 30,
          }),
        }
      )
      const spotJson = await spotRes.json()
      spotId = spotJson.data.touringPlanSpotId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/${spotId}`,
        'DELETE'
      )
    })

    test('経由地・休憩を削除できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/${spotId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.message).toBe('ツーリングプランスポット削除成功')

      const spotsRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const spotsJson = await spotsRes.json()
      expect(spotsJson.data).toEqual([])
    })

    test('削除後は残存スポットのplannedArrivalOffsetMinutes/plannedDepartureOffsetMinutesが再計算される', async () => {
      // 後続の経由地を追加
      const nextRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'BREAK',
            name: '残存休憩',
            travelMinutesFromPrev: 60,
            stayMinutes: 10,
          }),
        }
      )
      const nextJson = await nextRes.json()
      const nextSpotId: string = nextJson.data.touringPlanSpotId

      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/${spotId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const spotsRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const spotsJson = await spotsRes.json()
      const remainingSpot = spotsJson.data.find(
        (s: { touringPlanSpotId: string }) => s.touringPlanSpotId === nextSpotId
      )
      // 先頭スポットの削除により、残存スポットは出発(0分後)を起点に再計算される
      expect(remainingSpot).toMatchObject({
        plannedArrivalOffsetMinutes: 0,
        plannedDepartureOffsetMinutes: 10,
      })
    })

    test('存在しないspotIdを指定した場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/touring-plans/${touringPlanId}/spots/${randomUUID()}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })
  })
})
