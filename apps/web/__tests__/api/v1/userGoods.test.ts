import { beforeEach, describe, expect, test } from 'vitest'
import {
  createGuestUser,
  createTestUser,
  testAuthRequired,
} from '../../helpers/authHelper'
import { createTestUserBike } from '../../helpers/bikeHelper'
import { getTestGoodsModelId } from '../../helpers/goodsModelHelper'
import {
  expect404Error,
  expectValidationError,
} from '../../helpers/validationHelper'
import { app } from '@/lib/api/server/app'

describe('UserGoods API Endpoints', () => {
  let token: string
  let goodsModelId: string

  beforeEach(async () => {
    const user = await createTestUser()
    token = user.token
    goodsModelId = await getTestGoodsModelId()
  })

  describe('POST /api/v1/user-goods', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user-goods', 'POST', { goodsModelId })
    })

    test('バリデーションエラーが発生した場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('存在しないgoodsModelIdを指定した場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goodsModelId: 'invalid-goods-model-id' }),
      })

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
      expect(json.message).toBe('指定されたグッズが見つかりません')
    })

    test('他ユーザーのマイバイクを指定した場合にエラーとなる', async () => {
      const otherUser = await createTestUser()
      const otherBike = await createTestUserBike(otherUser.token, {
        displacement: 400,
      })

      const res = await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goodsModelId,
          userMyBikeId: otherBike.myUserBikeId,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
      expect(json.message).toBe('指定されたバイクが見つかりません')
    })

    test('マイバイクの紐付けなしでグッズを登録できる', async () => {
      const res = await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goodsModelId,
          purchasedAt: '2024-01-01T00:00:00.000Z',
          price: 5000,
          memo: 'テスト購入',
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.message).toBe('購入グッズ登録成功')
      expect(json.data.userGoodsId).toBeDefined()
      expect(json.data.userMyBikeId).toBeNull()
      expect(json.data.goodsModelId).toBe(goodsModelId)
      expect(json.data.price).toBe(5000)
      expect(json.data.memo).toBe('テスト購入')
      expect(json.data.manufacturerName).toBeDefined()
      expect(json.data.modelName).toBeDefined()
    })

    test('マイバイクに紐付けてグッズを登録できる', async () => {
      const bike = await createTestUserBike(token, { displacement: 400 })

      const res = await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goodsModelId,
          userMyBikeId: bike.myUserBikeId,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.userMyBikeId).toBe(bike.myUserBikeId)
    })
  })

  describe('GET /api/v1/user-goods', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user-goods', 'GET')
    })

    test('自分が登録したグッズ一覧のみ取得できる', async () => {
      await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goodsModelId }),
      })

      const otherUser = await createTestUser()
      await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${otherUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goodsModelId }),
      })

      const res = await app.request('/api/v1/user-goods', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(1)
    })

    test('myUserBikeIdで絞り込める', async () => {
      const bike = await createTestUserBike(token, { displacement: 400 })
      await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goodsModelId, userMyBikeId: bike.myUserBikeId }),
      })
      // 紐付けなしのグッズも登録（絞り込み対象外になるはず）
      await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goodsModelId }),
      })

      const res = await app.request(
        `/api/v1/user-goods?myUserBikeId=${bike.myUserBikeId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.length).toBe(1)
      expect(json.data[0].userMyBikeId).toBe(bike.myUserBikeId)
    })

    test('他ユーザーのmyUserBikeIdを指定した場合は404となる', async () => {
      const otherUser = await createTestUser()
      const otherBike = await createTestUserBike(otherUser.token, {
        displacement: 400,
      })

      const res = await app.request(
        `/api/v1/user-goods?myUserBikeId=${otherBike.myUserBikeId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })
  })

  describe('GET /api/v1/user-goods/:userGoodsId', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user-goods/dummy-id', 'GET')
    })

    test('存在しないIDの場合は404となる', async () => {
      const res = await app.request('/api/v1/user-goods/invalid-id', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('他ユーザーのグッズは取得できない', async () => {
      const otherUser = await createTestUser()
      const createRes = await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${otherUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goodsModelId }),
      })
      const createJson = await createRes.json()

      const res = await app.request(
        `/api/v1/user-goods/${createJson.data.userGoodsId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('マスタ情報がJOINされた詳細を取得できる', async () => {
      const createRes = await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goodsModelId }),
      })
      const createJson = await createRes.json()

      const res = await app.request(
        `/api/v1/user-goods/${createJson.data.userGoodsId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.userGoodsId).toBe(createJson.data.userGoodsId)
      expect(json.data.manufacturerName).toBe(createJson.data.manufacturerName)
      expect(json.data.modelNumber).toBeDefined()
    })
  })

  describe('PATCH /api/v1/user-goods/:userGoodsId', () => {
    test('存在しないIDの場合は404となる', async () => {
      const res = await app.request('/api/v1/user-goods/invalid-id', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: 1000 }),
      })

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('価格・メモを更新できる', async () => {
      const createRes = await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goodsModelId, price: 1000 }),
      })
      const createJson = await createRes.json()

      const res = await app.request(
        `/api/v1/user-goods/${createJson.data.userGoodsId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ price: 2000, memo: '更新済み' }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.price).toBe(2000)
      expect(json.data.memo).toBe('更新済み')
    })

    test('他ユーザーのマイバイクへ更新で紐付けようとするとエラーになる', async () => {
      const createRes = await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goodsModelId }),
      })
      const createJson = await createRes.json()

      const otherUser = await createTestUser()
      const otherBike = await createTestUserBike(otherUser.token, {
        displacement: 400,
      })

      const res = await app.request(
        `/api/v1/user-goods/${createJson.data.userGoodsId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userMyBikeId: otherBike.myUserBikeId }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })
  })

  describe('DELETE /api/v1/user-goods/:userGoodsId', () => {
    test('存在しないIDの場合は404となる', async () => {
      const res = await app.request('/api/v1/user-goods/invalid-id', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('グッズを削除できる', async () => {
      const createRes = await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goodsModelId }),
      })
      const createJson = await createRes.json()

      const res = await app.request(
        `/api/v1/user-goods/${createJson.data.userGoodsId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      expect(res.status).toBe(200)

      const getRes = await app.request(
        `/api/v1/user-goods/${createJson.data.userGoodsId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      expect(getRes.status).toBe(404)
    })
  })

  describe('ゲストアカウントのグッズ登録制限（5件まで）', () => {
    test('ゲストアカウントは5件まで登録できる', async () => {
      const guest = await createGuestUser()

      for (let i = 0; i < 5; i++) {
        const res = await app.request('/api/v1/user-goods', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${guest.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ goodsModelId }),
        })
        expect(res.status).toBe(201)
      }
    })

    test('ゲストアカウントは6件目のグッズを登録できない', async () => {
      const guest = await createGuestUser()

      for (let i = 0; i < 5; i++) {
        await app.request('/api/v1/user-goods', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${guest.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ goodsModelId }),
        })
      }

      const res = await app.request('/api/v1/user-goods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${guest.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goodsModelId }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json).toMatchObject({
        status: 'error',
        errorCode: 'INVALID_REQUEST',
        message: 'ゲストアカウントはグッズを5件まで登録できます',
      })
    })
  })
})
