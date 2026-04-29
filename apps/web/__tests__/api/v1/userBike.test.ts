import { randomUUID } from 'crypto'
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  afterEach,
} from 'vitest'
import { prisma } from '@repo/database'
import {
  createGuestUser,
  createTestUser,
  testAuthRequired,
} from '../../helpers/authHelper'
import { createTestUserBike, getTestBikeId } from '../../helpers/bikeHelper'
import {
  createTestFuelLog,
  createMultipleFuelLogs,
} from '../../helpers/fuelLogHelper'
import {
  createMultipleTourings,
  createTestTouring,
  createTestSpot,
} from '../../helpers/touringHelper'
import {
  expectValidationError,
  expect404Error,
} from '../../helpers/validationHelper'
import { app } from '@/lib/api/server/app'

describe('UserBike API Endpoints', () => {
  describe('POST /api/v1/user-bike/register', () => {
    let token: string
    let userId: string
    let bikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token
      userId = user.userId
      bikeId = await getTestBikeId()
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user-bike/register', 'POST', { bikeId })
    })

    test('必須項目が欠けている場合はバリデーションエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
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
      expect(json.details.length).toBeGreaterThan(0)
    })

    test('新規ユーザーバイクを登録できる', async () => {
      const serialNumber = `SN-${randomUUID()}`
      const purchaseDate = '2024-01-01T00:00:00.000Z'

      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId,
          serialNumber,
          nickname: 'メインバイク',
          purchaseDate,
          purchasePrice: 500000,
          purchaseMileage: 1200,
          totalMileage: 1500,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.message).toBe('ユーザーバイク登録成功')
      expect(json.data.userBikeId).toEqual(expect.any(String))
      expect(json.data.myUserBikeId).toEqual(expect.any(String))
      expect(json.data.bikeId).toBe(bikeId)
      expect(json.data.nickname).toBe('メインバイク')
      expect(json.data.purchaseDate).toBe(purchaseDate)
      expect(json.data.purchasePrice).toBe(500000)
      expect(json.data.purchaseMileage).toBe(1200)
      expect(json.data.totalMileage).toBe(1500)
      expect(json.data.manufacturerName).toEqual(expect.any(String))
      expect(json.data.modelName).toEqual(expect.any(String))
      expect(typeof json.data.createdAt).toBe('string')
      expect(typeof json.data.updatedAt).toBe('string')

      const createdUserBikeId = json.data.userBikeId
      const createdMyUserBikeId = json.data.myUserBikeId

      const userBikeRecord = await prisma.tUserBike.findUnique({
        where: { id: json.data.userBikeId },
      })
      expect(userBikeRecord?.serialNumber).toBe(serialNumber)
      expect(userBikeRecord?.bikeId).toBe(bikeId)
      expect(userBikeRecord?.totalMileage).toBe(1500)

      const myUserBikeRecord = await prisma.tUserMyBike.findUnique({
        where: { id: json.data.myUserBikeId },
      })
      expect(myUserBikeRecord?.userId).toBe(userId)
      expect(myUserBikeRecord?.purchasePrice).toBe(500000)
      expect(myUserBikeRecord?.purchaseMileage).toBe(1200)
      expect(myUserBikeRecord?.purchaseDate?.toISOString()).toBe(purchaseDate)

      const listRes = await app.request('/api/v1/user-bike/bikes', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const listJson = await listRes.json()
      expect(listRes.status).toBe(200)
      expect(listJson.status).toBe('success')
      expect(Array.isArray(listJson.data.bikes)).toBe(true)

      const registeredBike = listJson.data.bikes.find(
        (bike: { userBikeId: string }) => bike.userBikeId === createdUserBikeId
      )

      expect(registeredBike).toBeDefined()
      expect(registeredBike?.myUserBikeId).toBe(createdMyUserBikeId)
      expect(registeredBike?.manufacturerName).toEqual(expect.any(String))
      expect(registeredBike?.modelName).toEqual(expect.any(String))
      expect(registeredBike?.nickname).toBe('メインバイク')
      expect(registeredBike?.purchaseDate).toBe(purchaseDate)
      expect(registeredBike?.totalMileage).toBe(1500)
      expect(registeredBike?.displacement).toBeGreaterThan(0)
    })

    test('車台番号を指定しなくても登録できる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId,
          nickname: 'セカンドバイク',
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.data.userBikeId).toEqual(expect.any(String))
      expect(json.data.myUserBikeId).toEqual(expect.any(String))
      expect(json.data.nickname).toBe('セカンドバイク')

      const userBikeRecord = await prisma.tUserBike.findUnique({
        where: { id: json.data.userBikeId },
      })

      expect(userBikeRecord?.serialNumber).toBeNull()
      expect(userBikeRecord?.bikeId).toBe(bikeId)
    })

    test('bikeIdを指定せず排気量のみで登録できる', async () => {
      const displacement = 400
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displacement,
          nickname: '排気量のみ登録',
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.data.bikeId).toBeNull()
      expect(json.data.manufacturerName).toBeNull()
      expect(json.data.modelName).toBeNull()
      expect(json.data.modelYear).toBeNull()
      expect(json.data.displacement).toBe(displacement)

      const userBikeRecord = await prisma.tUserBike.findUnique({
        where: { id: json.data.userBikeId },
      })

      expect(userBikeRecord?.bikeId).toBeNull()
      expect(userBikeRecord?.displacement).toBe(displacement)
    })

    test('同じ車台番号でも登録できる', async () => {
      const serialNumber = `SN-${randomUUID()}`
      // 1回目の登録
      await createTestUserBike(token, { bikeId, serialNumber })

      // 同じ車台番号で2回目の登録
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId,
          serialNumber,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.data.userBikeId).toEqual(expect.any(String))
      expect(json.data.myUserBikeId).toEqual(expect.any(String))

      const userBikeRecord = await prisma.tUserBike.findUnique({
        where: { id: json.data.userBikeId },
      })

      expect(userBikeRecord?.serialNumber).toBe(serialNumber)
    })

    test('登録台数制限でエラーになる 1台目→2台目→3台目(エラー)', async () => {
      // 1台目
      const res1 = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displacement: 250,
          nickname: 'バイク1',
        }),
      })

      expect(res1.status).toBe(201)

      // 2台目
      const res2 = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displacement: 250,
          nickname: 'バイク2',
        }),
      })
      expect(res2.status).toBe(201)

      // 3台目（エラーになる）
      const res3 = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displacement: 250,
          nickname: 'バイク3',
        }),
      })
      const json3 = await res3.json()
      expect(res3.status).toBe(400)
      expect(json3.status).toBe('error')
      expect(json3).toEqual({
        status: 'error',
        errorCode: 'INVALID_REQUEST',
        message: '無料プランでは2台まで登録可能です',
      })
    })
  })

  describe('GET /api/v1/user-bike/bikes', () => {
    let token: string

    beforeAll(async () => {
      const user = await createTestUser()
      token = user.token

      // ソートテスト用に複数バイクを作成
      await createTestUserBike(token, {
        displacement: 250,
        nickname: `テストバイク1`,
        totalMileage: 1000,
      })
      await createTestUserBike(token, {
        displacement: 250,
        nickname: `テストバイク2`,
        totalMileage: 2,
      })
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user-bike/bikes', 'GET')
    })

    test('ユーザーの所有バイク一覧を取得できる', async () => {
      const res = await app.request('/api/v1/user-bike/bikes', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.message).toBe('ユーザー所有バイク一覧取得成功')
      expect(Array.isArray(json.data.bikes)).toBe(true)
      expect(json.data.bikes.length).toBeGreaterThan(0)

      json.data.bikes.forEach(
        (bike: {
          userBikeId: string
          createdAt: string
          updatedAt: string
        }) => {
          expect(typeof bike.userBikeId).toBe('string')
          expect(typeof bike.createdAt).toBe('string')
          expect(typeof bike.updatedAt).toBe('string')
        }
      )
    })

    test('デフォルトでupdatedAtの降順でソートされる（パラメータなし）', async () => {
      const res = await app.request('/api/v1/user-bike/bikes', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data.bikes.length).toBeGreaterThan(0)

      // updatedAtの降順であることを検証
      for (let i = 0; i < json.data.bikes.length - 1; i++) {
        const current = new Date(json.data.bikes[i].updatedAt).getTime()
        const next = new Date(json.data.bikes[i + 1].updatedAt).getTime()
        expect(current).toBeGreaterThanOrEqual(next)
      }
    })

    test('created-atで昇順ソートできる', async () => {
      const res = await app.request(
        '/api/v1/user-bike/bikes?sort-by=created-at&sort-order=asc',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')

      // createdAtの昇順であることを検証
      for (let i = 0; i < json.data.bikes.length - 1; i++) {
        const current = new Date(json.data.bikes[i].createdAt).getTime()
        const next = new Date(json.data.bikes[i + 1].createdAt).getTime()
        expect(current).toBeLessThanOrEqual(next)
      }
    })

    test('updated-atで降順ソートできる', async () => {
      const res = await app.request(
        '/api/v1/user-bike/bikes?sort-by=updated-at&sort-order=desc',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')

      // updatedAtの降順であることを検証
      for (let i = 0; i < json.data.bikes.length - 1; i++) {
        const current = new Date(json.data.bikes[i].updatedAt).getTime()
        const next = new Date(json.data.bikes[i + 1].updatedAt).getTime()
        expect(current).toBeGreaterThanOrEqual(next)
      }
    })

    test('無効なsort-byパラメータはバリデーションエラーになる', async () => {
      const res = await app.request('/api/v1/user-bike/bikes?sort-by=invalid', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('無効なsort-orderパラメータはバリデーションエラーになる', async () => {
      const res = await app.request(
        '/api/v1/user-bike/bikes?sort-order=invalid',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })
  })

  describe('GET /api/v1/user-bike/bike/:myUserBikeId', () => {
    let token: string
    let myUserBikeId: string
    const purchaseDate = '2024-01-01T00:00:00.000Z'

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token
      const bikeId = await getTestBikeId()

      const bike = await createTestUserBike(token, {
        bikeId,
        nickname: 'メインバイク',
        purchaseDate,
        purchasePrice: 500000,
        purchaseMileage: 1200,
        totalMileage: 1500,
      })
      myUserBikeId = bike.myUserBikeId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(`/api/v1/user-bike/bike/${myUserBikeId}`, 'GET')
    })

    test('ユーザー所有バイクの詳細を取得できる', async () => {
      const res = await app.request(`/api/v1/user-bike/bike/${myUserBikeId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.message).toBe('ユーザー所有バイク詳細取得成功')
      expect(json.data.userBikeId).toEqual(expect.any(String))
      expect(json.data.myUserBikeId).toBe(myUserBikeId)
      expect(json.data.nickname).toBe('メインバイク')
      expect(json.data.purchaseDate).toBe(purchaseDate)
      expect(json.data.totalMileage).toBe(1500)
      expect(json.data.purchasePrice).toBe(500000)
      expect(json.data.purchaseMileage).toBe(1200)
    })
  })

  describe('PATCH /api/v1/user-bike/bike/:myUserBikeId', () => {
    let token: string
    let myUserBikeId: string
    const updatedNickname = 'アップデート後のバイク'

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token
      const bikeId = await getTestBikeId()

      const bike = await createTestUserBike(token, {
        bikeId,
        nickname: 'メインバイク',
        purchaseDate: '2024-01-01T00:00:00.000Z',
        purchasePrice: 500000,
        purchaseMileage: 1200,
        totalMileage: 1500,
      })
      myUserBikeId = bike.myUserBikeId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}`,
        'PATCH',
        { nickname: updatedNickname }
      )
    })

    test('不正な入力の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(`/api/v1/user-bike/bike/${myUserBikeId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalMileage: -100,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('存在しないバイクIDの場合は404となる', async () => {
      const res = await app.request(`/api/v1/user-bike/bike/${randomUUID()}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: updatedNickname,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('ユーザー所有バイクの情報を更新できる', async () => {
      const purchaseDate = '2024-02-02T00:00:00.000Z'
      const res = await app.request(`/api/v1/user-bike/bike/${myUserBikeId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: updatedNickname,
          purchaseDate,
          purchasePrice: 450000,
          purchaseMileage: 1300,
          totalMileage: 2100,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data.nickname).toBe(updatedNickname)
      expect(json.data.purchaseDate).toBe(purchaseDate)
      expect(json.data.purchasePrice).toBe(450000)
      expect(json.data.purchaseMileage).toBe(1300)
      expect(json.data.totalMileage).toBe(2100)

      const myUserBikeRecord = await prisma.tUserMyBike.findUnique({
        where: { id: myUserBikeId },
      })
      const userBikeRecord = myUserBikeRecord
        ? await prisma.tUserBike.findUnique({
            where: { id: myUserBikeRecord.userBikeId },
          })
        : null

      expect(myUserBikeRecord?.nickname).toBe(updatedNickname)
      expect(myUserBikeRecord?.purchaseDate?.toISOString()).toBe(purchaseDate)
      expect(myUserBikeRecord?.purchasePrice).toBe(450000)
      expect(myUserBikeRecord?.purchaseMileage).toBe(1300)
      expect(userBikeRecord?.totalMileage).toBe(2100)
    })

    test('排気量のみで登録したバイクの排気量を更新できる', async () => {
      // 排気量のみで新しいバイクを登録
      const bike = await createTestUserBike(token, {
        displacement: 250,
        nickname: '排気量更新テスト',
      })

      const updatedDisplacement = 300
      const res = await app.request(
        `/api/v1/user-bike/bike/${bike.myUserBikeId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displacement: updatedDisplacement,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data.displacement).toBe(updatedDisplacement)

      const userBikeRecord = await prisma.tUserBike.findUnique({
        where: { id: bike.userBikeId },
      })

      expect(userBikeRecord?.displacement).toBe(updatedDisplacement)
    })

    test('モデル登録済みバイクの排気量更新はエラーになる', async () => {
      const res = await app.request(`/api/v1/user-bike/bike/${myUserBikeId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displacement: 500,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('INVALID_REQUEST')
    })
  })

  describe('POST /api/v1/user-bike/bike/:myUserBikeId/fuel-logs', () => {
    let token: string
    let myUserBikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: '燃料ログテスト用バイク',
        totalMileage: 2000,
      })
      myUserBikeId = bike.myUserBikeId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        'POST',
        {
          refueledAt: '2024-03-01T10:00:00.000Z',
          mileage: 2500,
          previousMileage: 2400,
          amount: 10.5,
          totalPrice: 1800,
        }
      )
    })

    test('必須項目が欠けている場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
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
      expect(json.details.length).toBeGreaterThan(0)
    })

    test('不正な入力の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refueledAt: '2024-03-01T10:00:00.000Z',
            mileage: -100,
            previousMileage: -200,
            amount: 0,
            totalPrice: -500,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('存在しないバイクIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${randomUUID()}/fuel-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refueledAt: '2024-03-01T10:00:00.000Z',
            mileage: 2500,
            previousMileage: 2400,
            amount: 10.5,
            totalPrice: 1800,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('燃料ログを登録できる', async () => {
      const refueledAt = '2024-03-01T10:00:00.000Z'
      const memo = 'ハイオク満タン'
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refueledAt,
            mileage: 2500,
            previousMileage: 2400,
            amount: 10.5,
            totalPrice: 1800,
            memo,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json).toEqual({
        status: 'success',
        data: {
          fuelLogId: expect.any(String),
          refueledAt,
          mileage: 2500,
          previousMileage: 2400,
          amount: 10.5,
          totalPrice: 1800,
          memo,
          fuelEfficiency: 9.5, // 小数点以下1桁で四捨五入
          pricePerLiter: 171.4, // 小数点以下1桁で四捨五入
          touringId: null,
          touringTitle: null,
        },
        message: '燃料ログ登録成功',
      })

      const fuelLogRecord = await prisma.tUserMyBikeFuelLog.findUnique({
        where: { id: json.data.fuelLogId },
      })
      expect(fuelLogRecord?.userMyBikeId).toBe(myUserBikeId)
      expect(fuelLogRecord?.mileage).toBe(2500)
      expect(fuelLogRecord?.previousMileage).toBe(2400)
      expect(fuelLogRecord?.amount).toBe(10.5)
      expect(fuelLogRecord?.price).toBe(1800)
      expect(fuelLogRecord?.refueledAt.toISOString()).toBe(refueledAt)
      expect(fuelLogRecord?.memo).toBe(memo)
    })

    test('updateTotalMileageがtrueの場合に総走行距離が更新される', async () => {
      const myUserBikeBefore = await prisma.tUserMyBike.findUnique({
        where: { id: myUserBikeId },
      })
      if (!myUserBikeBefore) {
        throw new Error('テストバイクが見つかりません')
      }

      const userBikeBefore = await prisma.tUserBike.findUnique({
        where: { id: myUserBikeBefore.userBikeId },
      })
      const currentMileage = userBikeBefore?.totalMileage ?? 0

      const newMileage = currentMileage + 500
      const refueledAt = '2024-03-15T10:00:00.000Z'

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refueledAt,
            mileage: newMileage,
            previousMileage: currentMileage,
            amount: 12.0,
            totalPrice: 2000,
            updateTotalMileage: true,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.mileage).toBe(newMileage)

      const userBikeAfter = await prisma.tUserBike.findUnique({
        where: { id: myUserBikeBefore.userBikeId },
      })
      expect(userBikeAfter?.totalMileage).toBe(newMileage)
    })

    test('updateTotalMileageがtrueでも現在値より小さい場合は更新されない', async () => {
      const myUserBikeBefore = await prisma.tUserMyBike.findUnique({
        where: { id: myUserBikeId },
      })
      if (!myUserBikeBefore) {
        throw new Error('テストバイクが見つかりません')
      }

      const userBikeBefore = await prisma.tUserBike.findUnique({
        where: { id: myUserBikeBefore.userBikeId },
      })
      const currentMileage = userBikeBefore?.totalMileage ?? 0

      const smallerMileage = currentMileage - 100
      const refueledAt = '2024-02-01T10:00:00.000Z'

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refueledAt,
            mileage: smallerMileage,
            previousMileage: smallerMileage - 100,
            amount: 8.0,
            totalPrice: 1400,
            updateTotalMileage: true,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.mileage).toBe(smallerMileage)

      const userBikeAfter = await prisma.tUserBike.findUnique({
        where: { id: myUserBikeBefore.userBikeId },
      })
      expect(userBikeAfter?.totalMileage).toBe(currentMileage)
    })

    describe('進行中ツーリングへの自動紐づけ', () => {
      test('進行中ツーリングがある場合、給油履歴が自動的に紐づけられる', async () => {
        // 1. ツーリング開始
        const touringRes = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'start',
              title: 'テストツーリング',
            }),
          }
        )
        const touringJson = await touringRes.json()
        const touringId = touringJson.data.touringId

        // 2. 給油履歴を登録（touringIdは指定しない）
        const fuelLogRes = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refueledAt: new Date().toISOString(),
              mileage: 3000,
              previousMileage: 2900,
              amount: 10,
              totalPrice: 1500,
              updateTotalMileage: true,
            }),
          }
        )

        const fuelLogJson = await fuelLogRes.json()
        expect(fuelLogRes.status).toBe(201)
        expect(fuelLogJson.data.touringId).toBe(touringId)
        expect(fuelLogJson.data.touringTitle).toBe('テストツーリング')
      })

      test('進行中ツーリングがない場合、給油履歴は紐づけられない', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refueledAt: new Date().toISOString(),
              mileage: 3000,
              previousMileage: 2900,
              amount: 10,
              totalPrice: 1500,
              updateTotalMileage: true,
            }),
          }
        )

        const json = await res.json()
        expect(res.status).toBe(201)
        expect(json.data.touringId).toBeNull()
        expect(json.data.touringTitle).toBeNull()
      })

      test('給油日時がツーリング開始前の場合、紐づけられない', async () => {
        const startDate = new Date()

        // 1. ツーリング開始
        await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'start',
              title: 'テストツーリング',
              startDate: startDate.toISOString(),
            }),
          }
        )

        // 2. 開始前の給油履歴を登録
        const pastDate = new Date(startDate.getTime() - 86400000) // 1日前
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refueledAt: pastDate.toISOString(),
              mileage: 3000,
              previousMileage: 2900,
              amount: 10,
              totalPrice: 1500,
              updateTotalMileage: true,
            }),
          }
        )

        const json = await res.json()
        expect(res.status).toBe(201)
        expect(json.data.touringId).toBeNull()
      })

      test('複数の給油履歴が同じツーリングに自動紐づけされる', async () => {
        // 1. ツーリング開始
        const touringRes = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'start',
              title: 'テストツーリング',
            }),
          }
        )
        const touringJson = await touringRes.json()
        const touringId = touringJson.data.touringId

        // 2. 1回目の給油
        const res1 = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refueledAt: new Date().toISOString(),
              mileage: 3000,
              previousMileage: 2900,
              amount: 10,
              totalPrice: 1500,
              updateTotalMileage: true,
            }),
          }
        )

        // 3. 2回目の給油
        const res2 = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refueledAt: new Date().toISOString(),
              mileage: 3100,
              previousMileage: 3000,
              amount: 10,
              totalPrice: 1500,
              updateTotalMileage: true,
            }),
          }
        )

        const json1 = await res1.json()
        const json2 = await res2.json()

        expect(json1.data.touringId).toBe(touringId)
        expect(json2.data.touringId).toBe(touringId)
      })
    })
  })

  describe('GET /api/v1/user-bike/history', () => {
    let token: string
    let myUserBikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: '全ヒストリーテスト用',
      })
      myUserBikeId = bike.myUserBikeId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/user-bike/history', 'GET')
    })

    test('バイクがない場合は空配列が返る', async () => {
      const user = await createTestUser()
      const res = await app.request('/api/v1/user-bike/history', {
        method: 'GET',
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data).toHaveLength(0)
    })

    test('給油履歴とツーリング履歴を時系列で統合して取得できる', async () => {
      await createTestTouring(token, myUserBikeId, {
        title: '箱根ツーリング',
        startDate: '2024-04-01T00:00:00.000Z',
        endDate: '2024-04-02T00:00:00.000Z',
      })

      await createTestFuelLog(token, myUserBikeId, {
        refueledAt: '2024-04-05T00:00:00.000Z',
        mileage: 1200,
        previousMileage: 1100,
        amount: 10,
        totalPrice: 1800,
      })

      const res = await app.request('/api/v1/user-bike/history', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data).toHaveLength(2)
      expect(json.data[0].type).toBe('FUEL_LOG')
      expect(json.data[1].type).toBe('TOURING')
    })

    test('各ヒストリーアイテムに bikeId と bikeName が含まれる', async () => {
      await createTestFuelLog(token, myUserBikeId, {
        refueledAt: '2024-05-01T00:00:00.000Z',
        mileage: 2000,
        previousMileage: 1900,
        amount: 10,
        totalPrice: 1800,
      })

      const res = await app.request('/api/v1/user-bike/history', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data[0].bikeId).toBe(myUserBikeId)
      expect(typeof json.data[0].bikeName).toBe('string')
      expect(json.data[0].bikeName).toBe('全ヒストリーテスト用')
    })

    test('複数バイクの履歴が統合して返される', async () => {
      const bike2 = await createTestUserBike(token, {
        displacement: 250,
        nickname: '2台目バイク',
      })

      await createTestFuelLog(token, myUserBikeId, {
        refueledAt: '2024-06-01T00:00:00.000Z',
        mileage: 1000,
        previousMileage: 900,
        amount: 10,
        totalPrice: 1500,
      })
      await createTestTouring(token, bike2.myUserBikeId, {
        title: '2台目ツーリング',
        startDate: '2024-06-02T00:00:00.000Z',
        endDate: '2024-06-03T00:00:00.000Z',
      })

      const res = await app.request('/api/v1/user-bike/history', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toHaveLength(2)
      const bikeIds = json.data.map((item: { bikeId: string }) => item.bikeId)
      expect(bikeIds).toContain(myUserBikeId)
      expect(bikeIds).toContain(bike2.myUserBikeId)
    })

    test('他ユーザーのデータが混入しない', async () => {
      const otherUser = await createTestUser()
      const otherBike = await createTestUserBike(otherUser.token, {
        displacement: 600,
      })
      await createTestFuelLog(otherUser.token, otherBike.myUserBikeId, {
        refueledAt: '2024-07-01T00:00:00.000Z',
        mileage: 3000,
        previousMileage: 2900,
        amount: 10,
        totalPrice: 1800,
      })

      await createTestFuelLog(token, myUserBikeId, {
        refueledAt: '2024-07-02T00:00:00.000Z',
        mileage: 1500,
        previousMileage: 1400,
        amount: 10,
        totalPrice: 1500,
      })

      const res = await app.request('/api/v1/user-bike/history', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toHaveLength(1)
      expect(json.data[0].bikeId).toBe(myUserBikeId)
    })
  })

  describe('GET /api/v1/user-bike/bike/:myUserBikeId/history', () => {
    let token: string
    let myUserBikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: 'ヒストリーテスト用',
      })
      myUserBikeId = bike.myUserBikeId
    })

    test('給油履歴とツーリング履歴を時系列で統合して取得できる', async () => {
      await createTestTouring(token, myUserBikeId, {
        title: '箱根ツーリング',
        startDate: '2024-04-01T00:00:00.000Z',
        endDate: '2024-04-02T00:00:00.000Z',
      })

      await createTestFuelLog(token, myUserBikeId, {
        refueledAt: '2024-04-05T00:00:00.000Z',
        mileage: 1200,
        previousMileage: 1100,
        amount: 10,
        totalPrice: 1800,
      })

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/history`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data).toHaveLength(2)
      expect(json.data[0].type).toBe('FUEL_LOG')
      expect(json.data[1].type).toBe('TOURING')
    })

    test('他ユーザーのバイクIDを指定した場合は404となる', async () => {
      const otherUser = await createTestUser()
      const otherBike = await createTestUserBike(otherUser.token, {
        displacement: 250,
      })

      const res = await app.request(
        `/api/v1/user-bike/bike/${otherBike.myUserBikeId}/history`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('給油履歴を登録するとヒストリーに追加される', async () => {
      await createTestFuelLog(token, myUserBikeId, {
        refueledAt: '2024-05-01T00:00:00.000Z',
        mileage: 2000,
        previousMileage: 1900,
        amount: 10,
        totalPrice: 1800,
      })

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/history`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toHaveLength(1)
      expect(json.data[0].type).toBe('FUEL_LOG')
    })

    test('ツーリングを登録するとヒストリーに追加される', async () => {
      await createTestTouring(token, myUserBikeId, {
        title: '富士山ツーリング',
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-06-02T00:00:00.000Z',
      })

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/history`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toHaveLength(1)
      expect(json.data[0].type).toBe('TOURING')
    })

    test('給油履歴を削除するとヒストリーからも削除される', async () => {
      const fuelLogId = await createTestFuelLog(token, myUserBikeId, {
        refueledAt: '2024-07-01T00:00:00.000Z',
        mileage: 3000,
        previousMileage: 2900,
        amount: 10,
        totalPrice: 1800,
      })

      // 削除前はヒストリーに1件存在する
      const beforeRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/history`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const beforeJson = await beforeRes.json()
      expect(beforeJson.data).toHaveLength(1)

      // 給油履歴を削除
      await app.request(`/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fuelLogId }),
      })

      // 削除後はヒストリーも0件になる
      const afterRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/history`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const afterJson = await afterRes.json()
      expect(afterRes.status).toBe(200)
      expect(afterJson.data).toHaveLength(0)
    })
  })

  describe('GET /api/v1/user-bike/bike/:myUserBikeId/fuel-logs', () => {
    let token: string
    let myUserBikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 500,
        nickname: '燃料ログ一覧テスト用バイク',
        totalMileage: 1000,
      })
      myUserBikeId = bike.myUserBikeId

      // 5件の燃料ログを作成
      await createMultipleFuelLogs(token, myUserBikeId, [
        {
          refueledAt: '2024-01-01T10:00:00.000Z',
          mileage: 1000,
          amount: 10.0,
          totalPrice: 1500,
        },
        {
          refueledAt: '2024-02-01T10:00:00.000Z',
          mileage: 1500,
          amount: 12.0,
          totalPrice: 1800,
        },
        {
          refueledAt: '2024-03-01T10:00:00.000Z',
          mileage: 2000,
          amount: 11.5,
          totalPrice: 1700,
        },
        {
          refueledAt: '2024-04-01T10:00:00.000Z',
          mileage: 2500,
          amount: 13.0,
          totalPrice: 2000,
        },
        {
          refueledAt: '2024-05-01T10:00:00.000Z',
          mileage: 3000,
          amount: 10.5,
          totalPrice: 1600,
        },
      ])
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        'GET'
      )
    })

    test('存在しないバイクIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${randomUUID()}/fuel-logs`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('燃料ログ一覧を取得できる（デフォルトパラメータ）', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.message).toBe('燃料ログ一覧取得成功')
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(5)

      expect(json.data[0].refueledAt).toBe('2024-05-01T10:00:00.000Z')
      expect(json.data[4].refueledAt).toBe('2024-01-01T10:00:00.000Z')
    })

    test('period=latest-monthで最新給油日から1ヶ月分を取得できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?period=latest-month`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.length).toBe(2)
      expect(json.data[0].refueledAt).toBe('2024-05-01T10:00:00.000Z')
      expect(json.data[1].refueledAt).toBe('2024-04-01T10:00:00.000Z')
    })

    test('period=past-monthで現在日時から直近1ヶ月分を取得できる', async () => {
      vi.useFakeTimers().setSystemTime(new Date('2024-05-10T00:00:00.000Z'))

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?period=past-month`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.length).toBe(1)
      expect(json.data[0].refueledAt).toBe('2024-05-01T10:00:00.000Z')
    })

    test('period=latest-yearで最新給油日から1年分を取得できる', async () => {
      // 2年分のデータを作成
      await createMultipleFuelLogs(token, myUserBikeId, [
        {
          refueledAt: '2023-01-01T10:00:00.000Z',
          mileage: 500,
          amount: 10.0,
          totalPrice: 1500,
        },
        {
          refueledAt: '2023-06-01T10:00:00.000Z',
          mileage: 1000,
          amount: 10.0,
          totalPrice: 1500,
        },
        {
          refueledAt: '2024-06-01T10:00:00.000Z',
          mileage: 3500,
          amount: 10.0,
          totalPrice: 1500,
        },
      ])

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?period=latest-year`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      // 最新ログ: 2024-06-01、1年前: 2023-06-01
      // 取得されるべきデータ: 2023-06-01以降2024-06-01まで
      // 該当データ: 2023-06-01, 2024-01-01, 2024-02-01, 2024-03-01, 2024-04-01, 2024-05-01, 2024-06-01
      expect(json.data.length).toBe(7)
      expect(json.data[0].refueledAt).toBe('2024-06-01T10:00:00.000Z')
      expect(json.data[6].refueledAt).toBe('2023-06-01T10:00:00.000Z')
    })

    test('period=latest-yearで古いデータのみの場合も正しく期間を取得できる', async () => {
      // 新しいバイクを作成して古いデータのみを登録
      const oldDataBike = await createTestUserBike(token, {
        displacement: 250,
        nickname: '古いデータバイク',
      })
      const oldBikeId = oldDataBike.myUserBikeId

      await createMultipleFuelLogs(token, oldBikeId, [
        {
          refueledAt: '2021-03-01T10:00:00.000Z',
          mileage: 500,
          amount: 10.0,
          totalPrice: 1500,
        },
        {
          refueledAt: '2021-05-01T10:00:00.000Z',
          mileage: 1000,
          amount: 10.0,
          totalPrice: 1500,
        },
        {
          refueledAt: '2022-06-01T10:00:00.000Z',
          mileage: 2000,
          amount: 10.0,
          totalPrice: 1500,
        },
      ])

      const res = await app.request(
        `/api/v1/user-bike/bike/${oldBikeId}/fuel-logs?period=latest-year`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      // 最新ログ: 2022-06-01、1年前: 2021-06-01
      // 取得されるべきデータ: 2021-06-01以降2022-06-01まで
      // 該当データ: 2022-06-01のみ（2021-05-01は1年前より前なので含まれない）
      expect(json.data.length).toBe(1)
      expect(json.data[0].refueledAt).toBe('2022-06-01T10:00:00.000Z')
    })

    test('period=latest-yearで期間内にデータがない場合は空配列を返す', async () => {
      // 新しいバイクを作成して期間外のデータのみを登録
      const sparseDataBike = await createTestUserBike(token, {
        displacement: 400,
        nickname: '疎なデータバイク',
      })
      const sparseBikeId = sparseDataBike.myUserBikeId

      await createMultipleFuelLogs(token, sparseBikeId, [
        {
          refueledAt: '2020-01-01T10:00:00.000Z',
          mileage: 500,
          amount: 10.0,
          totalPrice: 1500,
        },
        {
          refueledAt: '2022-06-01T10:00:00.000Z',
          mileage: 1000,
          amount: 10.0,
          totalPrice: 1500,
        },
      ])

      const res = await app.request(
        `/api/v1/user-bike/bike/${sparseBikeId}/fuel-logs?period=latest-year`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      // 最新ログ: 2022-06-01、1年前: 2021-06-01
      // 取得されるべきデータ: 2021-06-01以降2022-06-01まで
      // 該当データ: 2022-06-01のみ
      expect(json.data.length).toBe(1)
      expect(json.data[0].refueledAt).toBe('2022-06-01T10:00:00.000Z')
    })

    test('同日の燃料ログは走行距離順で並ぶ', async () => {
      await createMultipleFuelLogs(token, myUserBikeId, [
        {
          refueledAt: '2024-03-01T10:00:00.000Z',
          mileage: 2100,
          amount: 10.0,
          totalPrice: 1500,
        },
        {
          refueledAt: '2024-03-01T10:00:00.000Z',
          mileage: 1900,
          amount: 9.5,
          totalPrice: 1400,
        },
      ])

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      const marchLogs = json.data.filter(
        (log: { refueledAt: string; mileage: number }) =>
          log.refueledAt.startsWith('2024-03-01')
      )

      expect(marchLogs.length).toBe(3)
      expect(marchLogs[0].mileage).toBe(2100)
      expect(marchLogs[1].mileage).toBe(2000)
      expect(marchLogs[2].mileage).toBe(1900)
    })

    test('ページネーションが機能する', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?page=2&per-size=2`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.length).toBe(2)

      expect(json.data[0].refueledAt).toBe('2024-03-01T10:00:00.000Z')
      expect(json.data[1].refueledAt).toBe('2024-02-01T10:00:00.000Z')
    })

    test('ソート機能が動作する（mileage昇順）', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?sort-by=mileage&sort-order=asc`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.length).toBe(5)

      expect(json.data[0].mileage).toBe(1000)
      expect(json.data[1].mileage).toBe(1500)
      expect(json.data[4].mileage).toBe(3000)
    })

    test('ソート機能が動作する（refueled-at昇順）', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?sort-by=refueled-at&sort-order=asc`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data[0].refueledAt).toBe('2024-01-01T10:00:00.000Z')
      expect(json.data[4].refueledAt).toBe('2024-05-01T10:00:00.000Z')
    })

    test('燃料ログが0件の場合は空配列を返す', async () => {
      const bike = await createTestUserBike(token, {
        displacement: 125,
        nickname: '燃料ログなしバイク',
        totalMileage: 100,
      })

      const res = await app.request(
        `/api/v1/user-bike/bike/${bike.myUserBikeId}/fuel-logs`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data).toEqual([])
    })

    test('不正なクエリパラメータの場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?page=-1&per-size=200`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('レスポンスの形式が正しい', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)

      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBeGreaterThan(0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      json.data.forEach((log: any) => {
        expect(typeof log.fuelLogId).toBe('string')
        expect(typeof log.refueledAt).toBe('string')
        expect(typeof log.mileage).toBe('number')
        expect(typeof log.previousMileage).toBe('number')
        expect(typeof log.amount).toBe('number')
        expect(typeof log.totalPrice).toBe('number')
        expect(log.memo === null || typeof log.memo === 'string').toBe(true)

        expect(new Date(log.refueledAt).toISOString()).toBe(log.refueledAt)
      })
    })

    describe('日付範囲検索機能', () => {
      test('startDateとendDateを指定して期間内の給油履歴を取得できる', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?startDate=2024-01-15T00:00:00.000Z&endDate=2024-02-15T00:00:00.000Z`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const json = await res.json()
        expect(res.status).toBe(200)
        expect(json.status).toBe('success')
        expect(Array.isArray(json.data)).toBe(true)
      })

      test('periodとstartDate/endDateを同時に指定した場合はバリデーションエラーとなる', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?period=latest-month&startDate=2024-01-01T00:00:00.000Z&endDate=2024-02-01T00:00:00.000Z`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const json = await res.json()
        expect(res.status).toBe(400)
        expectValidationError(json)
      })

      test('startDateのみを指定した場合はバリデーションエラーとなる', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?startDate=2024-01-01T00:00:00.000Z`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const json = await res.json()
        expect(res.status).toBe(400)
        expectValidationError(json)
      })

      test('endDateのみを指定した場合はバリデーションエラーとなる', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?endDate=2024-02-01T00:00:00.000Z`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const json = await res.json()
        expect(res.status).toBe(400)
        expectValidationError(json)
      })

      test('startDateがendDateより後の場合はバリデーションエラーとなる', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?startDate=2024-03-01T00:00:00.000Z&endDate=2024-01-01T00:00:00.000Z`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const json = await res.json()
        expect(res.status).toBe(400)
        expectValidationError(json)
      })

      test('日付範囲検索時にページネーションが有効であることを確認', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?startDate=2024-01-01T00:00:00.000Z&endDate=2024-12-31T23:59:59.999Z&page=1&per-size=5`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const json = await res.json()
        expect(res.status).toBe(200)
        expect(json.data.length).toBeLessThanOrEqual(5)
      })

      test('日付範囲検索時にソート順を指定できる', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs?startDate=2024-01-01T00:00:00.000Z&endDate=2024-03-01T00:00:00.000Z&sort-order=asc`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const json = await res.json()
        expect(res.status).toBe(200)
        // ソート順が昇順であることを確認
        if (json.data.length > 1) {
          expect(
            new Date(json.data[0].refueledAt).getTime()
          ).toBeLessThanOrEqual(new Date(json.data[1].refueledAt).getTime())
        }
      })
    })
  })

  describe('GET /api/v1/user-bike/bike/:myUserBikeId/fuel-insights', () => {
    let token: string
    let myUserBikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 250,
        nickname: '燃費インサイトテスト用バイク',
        totalMileage: 900,
      })
      myUserBikeId = bike.myUserBikeId

      await createMultipleFuelLogs(token, myUserBikeId, [
        {
          refueledAt: '2024-01-01T10:00:00.000Z',
          mileage: 1000,
          previousMileage: 900,
          amount: 10.0,
          totalPrice: 1500,
        },
        {
          refueledAt: '2024-02-01T10:00:00.000Z',
          mileage: 1300,
          previousMileage: 1000,
          amount: 12.0,
          totalPrice: 1800,
        },
        {
          refueledAt: '2024-03-01T10:00:00.000Z',
          mileage: 1600,
          previousMileage: 1300,
          amount: 11.0,
          totalPrice: 2200,
        },
      ])
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-insights`,
        'GET'
      )
    })

    test('存在しないバイクIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${randomUUID()}/fuel-insights`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('燃費インサイトを取得できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-insights`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.message).toBe('燃費インサイト取得成功')
      expect(json.data.averageFuelEfficiency).toBeCloseTo(700 / 33, 5)
      expect(json.data.averageAmount).toBeCloseTo(11, 5)
      expect(json.data.averageTotalPrice).toBeCloseTo(1833.3333, 3)
      expect(json.data.averagePricePerLiter).toBeCloseTo(166.6666, 3)
      expect(json.data.minPricePerLiter).toBeCloseTo(150, 5)
      expect(json.data.maxPricePerLiter).toBeCloseTo(200, 5)
    })
  })

  describe('POST /api/v1/user-bike/bike/:myUserBikeId/tourings/start-end', () => {
    let token: string
    let myUserBikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: 'ツーリング開始終了テスト用バイク',
        totalMileage: 2000,
      })
      myUserBikeId = bike.myUserBikeId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
        'POST',
        {
          action: 'start',
        }
      )
    })

    test('終了時にツーリングIDがない場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'end',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('ツーリングを開始できる', async () => {
      const startDate = '2024-05-01T00:00:00.000Z'
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'start',
            title: '朝ツーリング',
            startDate,
            startMileage: 2000,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json).toEqual({
        status: 'success',
        data: {
          touringId: expect.any(String),
          title: '朝ツーリング',
          startDate,
          endDate: startDate,
          startMileage: 2000,
          endMileage: null,
          startLatitude: null,
          startLongitude: null,
          endLatitude: null,
          endLongitude: null,
          status: 'STARTED',
          fuelLogIds: [],
        },
        message: 'ツーリング開始成功',
      })

      const getTouringResult = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${json.data.touringId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const getTouringJson = await getTouringResult.json()
      expect(getTouringResult.status).toBe(200)
      expect(getTouringJson.data.touringId).toBe(json.data.touringId)
      expect(getTouringJson.data.title).toBe('朝ツーリング')
      expect(getTouringJson.data.startDate).toBe(startDate)
      expect(getTouringJson.data.endDate).toBe(startDate)
      expect(getTouringJson.data.startMileage).toBe(2000)
      expect(getTouringJson.data.endMileage).toBeNull()
    })

    test('ツーリングを終了できる', async () => {
      const startDate = '2024-05-01T00:00:00.000Z'
      const endDate = '2024-05-02T00:00:00.000Z'

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
            title: '夜ツーリング',
            startDate,
            startMileage: 2000,
          }),
        }
      )
      const startJson = await startRes.json()

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'end',
            touringId: startJson.data.touringId,
            endDate,
            endMileage: 2100,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json).toEqual({
        status: 'success',
        data: {
          touringId: startJson.data.touringId,
          title: '夜ツーリング',
          startDate,
          endDate,
          startMileage: 2000,
          endMileage: 2100,
          startLatitude: null,
          startLongitude: null,
          endLatitude: null,
          endLongitude: null,
          status: 'COMPLETED',
          fuelLogIds: [],
        },
        message: 'ツーリング終了成功',
      })

      const getTouringResult = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${startJson.data.touringId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const getTouringJson = await getTouringResult.json()
      expect(getTouringResult.status).toBe(200)
      expect(getTouringJson.data.touringId).toBe(startJson.data.touringId)
      expect(getTouringJson.data.title).toBe('夜ツーリング')
      expect(getTouringJson.data.startDate).toBe(startDate)
      expect(getTouringJson.data.endDate).toBe(endDate)
      expect(getTouringJson.data.startMileage).toBe(2000)
      expect(getTouringJson.data.endMileage).toBe(2100)
    })

    describe('総走行距離の自動取得', () => {
      test('ツーリング開始時にstartMileageが自動設定される', async () => {
        // 1. 給油履歴を追加してtotalMileageを5000kmに更新
        await createTestFuelLog(token, myUserBikeId, {
          refueledAt: new Date().toISOString(),
          amount: 10,
          totalPrice: 1500,
          mileage: 5000,
          previousMileage: 4900,
          updateTotalMileage: true,
        })

        // 2. ツーリング開始（startMileageを送信しない）
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'start',
              title: 'テストツーリング',
              // startMileageを送信しない
            }),
          }
        )

        const json = await res.json()
        expect(res.status).toBe(201)
        expect(json.data.startMileage).toBe(5000)
      })

      test('ツーリング終了時にendMileageが自動設定される', async () => {
        // 1. ツーリング開始
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
              title: 'テストツーリング',
            }),
          }
        )
        const startJson = await startRes.json()
        const touringId = startJson.data.touringId

        // 2. 給油してtotalMileageを5200kmに更新
        await createTestFuelLog(token, myUserBikeId, {
          refueledAt: new Date().toISOString(),
          amount: 8,
          totalPrice: 1200,
          mileage: 5200,
          previousMileage: 5000,
          updateTotalMileage: true,
        })

        // 3. ツーリング終了（endMileageを送信しない）
        const endRes = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'end',
              touringId,
              // endMileageを送信しない
            }),
          }
        )

        const endJson = await endRes.json()
        expect(endRes.status).toBe(200)
        expect(endJson.data.endMileage).toBe(5200)
        expect(endJson.data.startMileage).toBeDefined()

        // ツーリング距離が計算できることを確認
        const distance = endJson.data.endMileage! - endJson.data.startMileage!
        expect(distance).toBeGreaterThan(0)
      })

      test('フロントエンドから明示的にstartMileageが渡された場合は優先される', async () => {
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'start',
              title: 'テストツーリング',
              startMileage: 9999, // 明示的に指定
            }),
          }
        )

        const json = await res.json()
        expect(json.data.startMileage).toBe(9999) // フロントエンドの値が優先
      })

      test('totalMileageが0の場合でも正常に記録される', async () => {
        // バイクのtotalMileageが0の状態（デフォルト値のまま）
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/tourings/start-end`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'start',
              title: 'テストツーリング',
            }),
          }
        )

        const json = await res.json()
        expect(res.status).toBe(201)
        // バイクのtotalMileageが2000で作成されているので、それが取得される
        expect(json.data.startMileage).toBe(2000)
      })
    })
  })

  describe('POST /api/v1/user-bike/bike/:myUserBikeId/tourings', () => {
    let token: string
    let myUserBikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: 'ツーリングテスト用バイク',
        totalMileage: 2000,
      })
      myUserBikeId = bike.myUserBikeId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings`,
        'POST',
        {
          title: '春のツーリング',
          startDate: '2024-05-01T00:00:00.000Z',
          endDate: '2024-05-03T00:00:00.000Z',
        }
      )
    })

    test('必須項目が欠けている場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings`,
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
      expect(json.details.length).toBeGreaterThan(0)
    })

    test('不正な入力の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '',
            startDate: '2024-05-05T00:00:00.000Z',
            endDate: '2024-05-01T00:00:00.000Z',
            startMileage: 1000,
            endMileage: 900,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('存在しないバイクIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${randomUUID()}/tourings`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '夏のツーリング',
            startDate: '2024-06-01T00:00:00.000Z',
            endDate: '2024-06-02T00:00:00.000Z',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('ツーリングを登録できる', async () => {
      const startDate = '2024-05-01T00:00:00.000Z'
      const endDate = '2024-05-03T00:00:00.000Z'
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '春のツーリング',
            startDate,
            endDate,
            startMileage: 2000,
            endMileage: 2300,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json).toEqual({
        status: 'success',
        data: {
          touringId: expect.any(String),
          title: '春のツーリング',
          startDate,
          endDate,
          startMileage: 2000,
          endMileage: 2300,
          startLatitude: null,
          startLongitude: null,
          endLatitude: null,
          endLongitude: null,
          status: 'COMPLETED',
          fuelLogIds: [],
        },
        message: 'ツーリング登録成功',
      })

      const touringId = json.data.touringId

      const getTouringResult = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const getTouringJson = await getTouringResult.json()
      expect(getTouringResult.status).toBe(200)
      expect(getTouringJson.data.touringId).toBe(touringId)
      expect(getTouringJson.data.title).toBe('春のツーリング')
      expect(getTouringJson.data.startDate).toBe(startDate)
      expect(getTouringJson.data.endDate).toBe(endDate)
      expect(getTouringJson.data.startMileage).toBe(2000)
      expect(getTouringJson.data.endMileage).toBe(2300)
    })
  })

  describe('GET /api/v1/user-bike/bike/:myUserBikeId/tourings', () => {
    let token: string
    let myUserBikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 650,
        nickname: 'ツーリング一覧テスト用バイク',
        totalMileage: 3500,
      })
      myUserBikeId = bike.myUserBikeId

      await createMultipleTourings(token, myUserBikeId, [
        {
          title: '早春ツーリング',
          startDate: '2024-03-01T00:00:00.000Z',
          endDate: '2024-03-02T00:00:00.000Z',
          startMileage: 3000,
          endMileage: 3100,
        },
        {
          title: '春ツーリング',
          startDate: '2024-04-10T00:00:00.000Z',
          endDate: '2024-04-12T00:00:00.000Z',
          startMileage: 3100,
          endMileage: 3300,
        },
        {
          title: '初夏ツーリング',
          startDate: '2024-05-05T00:00:00.000Z',
          endDate: '2024-05-06T00:00:00.000Z',
          startMileage: 3300,
          endMileage: 3450,
        },
      ])
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings`,
        'GET'
      )
    })

    test('存在しないバイクIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${randomUUID()}/tourings`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('ツーリング一覧を取得できる（デフォルトパラメータ）', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.message).toBe('ツーリング一覧取得成功')
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBe(3)

      expect(json.data[0].startDate).toBe('2024-05-05T00:00:00.000Z')
      expect(json.data[2].startDate).toBe('2024-03-01T00:00:00.000Z')
    })

    test('ソート機能が動作する（end-date昇順）', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings?sort-by=end-date&sort-order=asc`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.length).toBe(3)
      expect(json.data[0].endDate).toBe('2024-03-02T00:00:00.000Z')
      expect(json.data[2].endDate).toBe('2024-05-06T00:00:00.000Z')
    })

    test('ツーリングが0件の場合は空配列を返す', async () => {
      const bike = await createTestUserBike(token, {
        displacement: 125,
        nickname: 'ツーリングなしバイク',
        totalMileage: 100,
      })

      const res = await app.request(
        `/api/v1/user-bike/bike/${bike.myUserBikeId}/tourings`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data).toEqual([])
    })

    test('不正なクエリパラメータの場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings?sort-order=invalid`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('レスポンスの形式が正しい', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      json.data.forEach((touring: any) => {
        expect(typeof touring.touringId).toBe('string')
        expect(typeof touring.title).toBe('string')
        expect(typeof touring.startDate).toBe('string')
        expect(typeof touring.endDate).toBe('string')
        expect(
          touring.startMileage === null ||
            typeof touring.startMileage === 'number'
        ).toBe(true)
        expect(
          touring.endMileage === null || typeof touring.endMileage === 'number'
        ).toBe(true)

        expect(new Date(touring.startDate).toISOString()).toBe(
          touring.startDate
        )
        expect(new Date(touring.endDate).toISOString()).toBe(touring.endDate)
      })
    })
  })

  describe('GET /api/v1/user-bike/bike/:myUserBikeId/tourings/:touringId', () => {
    let token: string
    let myUserBikeId: string
    let touringId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 500,
        nickname: 'ツーリング詳細テスト用バイク',
        totalMileage: 4000,
      })
      myUserBikeId = bike.myUserBikeId

      touringId = await createTestTouring(token, myUserBikeId, {
        title: '秋ツーリング',
        startDate: '2024-10-10T00:00:00.000Z',
        endDate: '2024-10-12T00:00:00.000Z',
        startMileage: 4000,
        endMileage: 4200,
      })
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
        'GET'
      )
    })

    test('存在しないバイクIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${randomUUID()}/tourings/${touringId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('存在しないツーリングIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${randomUUID()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('ツーリング詳細を取得できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json).toEqual({
        status: 'success',
        data: {
          touringId,
          title: '秋ツーリング',
          startDate: '2024-10-10T00:00:00.000Z',
          endDate: '2024-10-12T00:00:00.000Z',
          startMileage: 4000,
          endMileage: 4200,
          startLatitude: null,
          startLongitude: null,
          endLatitude: null,
          endLongitude: null,
          status: 'COMPLETED',
          fuelLogIds: [],
        },
        message: 'ツーリング取得成功',
      })
    })
  })

  describe('PATCH /api/v1/user-bike/bike/:myUserBikeId/tourings/:touringId', () => {
    let token: string
    let myUserBikeId: string
    let touringId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 500,
        nickname: 'ツーリング更新テスト用バイク',
        totalMileage: 4000,
      })
      myUserBikeId = bike.myUserBikeId

      touringId = await createTestTouring(token, myUserBikeId, {
        title: '更新前ツーリング',
        startDate: '2024-10-10T00:00:00.000Z',
        endDate: '2024-10-12T00:00:00.000Z',
        startMileage: 4000,
        endMileage: 4200,
      })
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
        'PATCH',
        {
          title: '更新後ツーリング',
        }
      )
    })

    test('更新項目が指定されていない場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
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

    test('不正な入力の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: '2024-10-13T00:00:00.000Z',
            endDate: '2024-10-11T00:00:00.000Z',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('存在しないバイクIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${randomUUID()}/tourings/${touringId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '更新後ツーリング',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('存在しないツーリングIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${randomUUID()}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '更新後ツーリング',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('ツーリングを更新できる', async () => {
      const endDate = '2024-10-13T00:00:00.000Z'
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '更新後ツーリング',
            endDate,
            endMileage: 4300,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json).toEqual({
        status: 'success',
        data: {
          touringId,
          title: '更新後ツーリング',
          startDate: '2024-10-10T00:00:00.000Z',
          endDate,
          startMileage: 4000,
          endMileage: 4300,
          startLatitude: null,
          startLongitude: null,
          endLatitude: null,
          endLongitude: null,
          status: 'COMPLETED',
          fuelLogIds: [],
        },
        message: 'ツーリング更新成功',
      })

      const getTouringResult = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const getTouringJson = await getTouringResult.json()
      expect(getTouringResult.status).toBe(200)
      expect(getTouringJson.data.touringId).toBe(touringId)
      expect(getTouringJson.data.title).toBe('更新後ツーリング')
      expect(getTouringJson.data.endDate).toBe(endDate)
      expect(getTouringJson.data.endMileage).toBe(4300)
    })

    test('開始・終了位置を更新できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startLatitude: 35.6895,
            startLongitude: 139.6917,
            endLatitude: 34.6937,
            endLongitude: 135.5023,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.startLatitude).toBeCloseTo(35.6895)
      expect(json.data.startLongitude).toBeCloseTo(139.6917)
      expect(json.data.endLatitude).toBeCloseTo(34.6937)
      expect(json.data.endLongitude).toBeCloseTo(135.5023)
    })

    test('位置情報をnullで削除できる', async () => {
      // まず位置情報を設定
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startLatitude: 35.6895,
            startLongitude: 139.6917,
          }),
        }
      )

      // nullで削除
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startLatitude: null,
            startLongitude: null,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.startLatitude).toBeNull()
      expect(json.data.startLongitude).toBeNull()
    })

    test('終了日を変更するとヒストリーの occurredAt も更新される', async () => {
      const newEndDate = '2024-10-20T00:00:00.000Z'

      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endDate: newEndDate }),
        }
      )

      const historyRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/history`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const historyJson = await historyRes.json()
      expect(historyRes.status).toBe(200)
      expect(historyJson.data).toHaveLength(1)
      expect(historyJson.data[0].occurredAt).toBe(newEndDate)
    })

    test('終了日以外のフィールドのみ変更した場合はヒストリーの occurredAt は変わらない', async () => {
      const beforeRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/history`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const beforeJson = await beforeRes.json()
      const originalOccurredAt = beforeJson.data[0].occurredAt

      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: '日付変更なし更新' }),
        }
      )

      const afterRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/history`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const afterJson = await afterRes.json()
      expect(afterRes.status).toBe(200)
      expect(afterJson.data[0].occurredAt).toBe(originalOccurredAt)
    })
  })

  describe('PATCH /api/v1/user-bike/bike/:myUserBikeId/fuel-logs', () => {
    let token: string
    let myUserBikeId: string
    let fuelLogId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      // テスト用バイク作成
      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: '燃料ログ更新テスト用バイク',
        totalMileage: 1000,
      })
      myUserBikeId = bike.myUserBikeId

      // テスト用燃料ログ作成
      fuelLogId = await createTestFuelLog(token, myUserBikeId, {
        refueledAt: '2024-03-01T10:00:00.000Z',
        mileage: 1500,
        amount: 10.0,
        totalPrice: 1500,
      })
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        'PATCH',
        {
          fuelLogId,
          mileage: 2000,
        }
      )
    })

    test('fuelLogIdが未指定の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mileage: 2000,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('更新項目が1つも指定されていない場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: fuelLogId,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
      expect(
        json.details.some(
          (d: { message: string }) =>
            d.message === 'いずれかの更新項目を指定してください'
        )
      ).toBe(true)
    })

    test('不正な入力の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: fuelLogId,
            mileage: -100,
            amount: 0,
            totalPrice: -500,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('存在しないバイクIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${randomUUID()}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: fuelLogId,
            mileage: 2000,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('存在しない燃料ログIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: randomUUID(),
            mileage: 2000,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('燃料ログのすべてのフィールドを更新できる', async () => {
      const refueledAt = '2024-03-15T15:30:00.000Z'
      const memo = '給油後に空気圧チェック'
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: fuelLogId,
            refueledAt,
            mileage: 2000,
            previousMileage: 1800,
            amount: 12.5,
            totalPrice: 2000,
            memo,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json).toEqual({
        status: 'success',
        data: {
          fuelLogId: fuelLogId,
          refueledAt,
          mileage: 2000,
          previousMileage: 1800,
          amount: 12.5,
          totalPrice: 2000,
          memo,
          fuelEfficiency: 16, // (2000 - 1800) / 12.5
          pricePerLiter: 160, // 2000 / 12.5
          touringId: null,
          touringTitle: null,
        },
        message: '燃料ログ更新成功',
      })

      // DBに反映されているか確認
      const fuelLogRecord = await prisma.tUserMyBikeFuelLog.findUnique({
        where: { id: fuelLogId },
      })
      expect(fuelLogRecord?.mileage).toBe(2000)
      expect(fuelLogRecord?.previousMileage).toBe(1800)
      expect(fuelLogRecord?.amount).toBe(12.5)
      expect(fuelLogRecord?.price).toBe(2000)
      expect(fuelLogRecord?.refueledAt.toISOString()).toBe(refueledAt)
      expect(fuelLogRecord?.memo).toBe(memo)
    })

    test('部分更新: 走行距離のみを更新できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId,
            mileage: 2100,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.mileage).toBe(2100)
      expect(json.data.amount).toBe(10.0)
      expect(json.data.totalPrice).toBe(1500)
    })

    test('部分更新: 給油量と価格のみを更新できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId,
            amount: 15.0,
            totalPrice: 2500,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.amount).toBe(15.0)
      expect(json.data.totalPrice).toBe(2500)
      expect(json.data.mileage).toBe(1500)
    })

    test('他のユーザーのバイクの燃料ログを更新しようとすると404となる', async () => {
      // 別のユーザーを作成
      const otherUser = await createTestUser()

      // 他のユーザーのトークンで更新を試みる
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${otherUser.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId,
            mileage: 3000,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('異なるバイクの燃料ログIDを指定すると404となる', async () => {
      // 別のバイクと燃料ログを作成
      const otherBike = await createTestUserBike(token, {
        displacement: 400,
        nickname: '別のバイク',
        totalMileage: 500,
      })

      const otherFuelLogId = await createTestFuelLog(
        token,
        otherBike.myUserBikeId,
        {
          refueledAt: '2024-04-01T10:00:00.000Z',
          mileage: 600,
          amount: 8.0,
          totalPrice: 1200,
        }
      )

      // バイクAの燃料ログをバイクBのエンドポイントで更新しようとする
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: otherFuelLogId,
            mileage: 700,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('previousMileageのみを不正な値(既存mileageより大きい値)で更新するとエラーとなる', async () => {
      // 既存の燃料ログのmileageは1500
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId,
            previousMileage: 2000, // 既存のmileage(1500)より大きい不正な値
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('INVALID_REQUEST')
      expect(json.message).toBe(
        '前回走行距離は給油時走行距離以下である必要があります'
      )
    })

    test('mileageのみを不正な値(既存previousMileageより小さい値)で更新するとエラーとなる', async () => {
      // 先にpreviousMileageを1400に更新
      await app.request(`/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fuelLogId,
          previousMileage: 1400,
        }),
      })

      // mileageを1400より小さい1200に更新しようとする
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId,
            mileage: 1200, // previousMileage(1400)より小さい不正な値
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('INVALID_REQUEST')
      expect(json.message).toBe(
        '前回走行距離は給油時走行距離以下である必要があります'
      )
    })

    test('給油日時を変更するとヒストリーの occurredAt も更新される', async () => {
      const newRefueledAt = '2024-03-15T15:30:00.000Z'

      await app.request(`/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fuelLogId, refueledAt: newRefueledAt }),
      })

      const historyRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/history`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const historyJson = await historyRes.json()
      expect(historyRes.status).toBe(200)
      expect(historyJson.data).toHaveLength(1)
      expect(historyJson.data[0].occurredAt).toBe(newRefueledAt)
    })

    test('給油日時以外のフィールドのみ変更した場合はヒストリーの occurredAt は変わらない', async () => {
      const beforeRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/history`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const beforeJson = await beforeRes.json()
      const originalOccurredAt = beforeJson.data[0].occurredAt

      await app.request(`/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fuelLogId, mileage: 2000 }),
      })

      const afterRes = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/history`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const afterJson = await afterRes.json()
      expect(afterRes.status).toBe(200)
      expect(afterJson.data[0].occurredAt).toBe(originalOccurredAt)
    })
  })

  describe('DELETE /api/v1/user-bike/bike/:myUserBikeId/fuel-logs', () => {
    let token: string
    let myUserBikeId: string
    let fuelLogId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      // テスト用バイク作成
      const bike = await createTestUserBike(token, {
        displacement: 400,
        nickname: '燃料ログ削除テスト用バイク',
        totalMileage: 1000,
      })
      myUserBikeId = bike.myUserBikeId

      // テスト用燃料ログ作成
      fuelLogId = await createTestFuelLog(token, myUserBikeId, {
        refueledAt: '2024-03-01T10:00:00.000Z',
        mileage: 1500,
        amount: 10.0,
        totalPrice: 1500,
      })
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        'DELETE',
        {
          fuelLogId,
        }
      )
    })

    test('fuelLogIdが未指定の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'DELETE',
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

    test('存在しないバイクIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${randomUUID()}/fuel-logs`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: fuelLogId,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('存在しない燃料ログIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: randomUUID(),
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('燃料ログを物理削除できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json).toEqual({
        status: 'success',
        message: '燃料ログ削除成功',
      })

      const getResult = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const getJson = await getResult.json()
      expect(
        getJson.data.some(
          (log: { fuelLogId: string }) => log.fuelLogId === fuelLogId
        )
      ).toBe(false)
    })

    test('削除後に総走行距離が更新されないことを確認', async () => {
      // 削除前のバイクの総走行距離を取得
      const myUserBikeBefore = await prisma.tUserMyBike.findUnique({
        where: { id: myUserBikeId },
      })
      if (!myUserBikeBefore) {
        throw new Error('テストバイクが見つかりません')
      }
      const bikeBefore = await prisma.tUserBike.findUnique({
        where: { id: myUserBikeBefore.userBikeId },
      })
      const totalMileageBefore = bikeBefore?.totalMileage

      // 燃料ログを削除
      await app.request(`/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fuelLogId,
        }),
      })

      const userBikeResult = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const userBikeJson = await userBikeResult.json()
      expect(userBikeJson.data.totalMileage).toBe(totalMileageBefore)
    })

    test('他のユーザーのバイクの燃料ログを削除しようとすると404となる', async () => {
      // 別のユーザーを作成
      const otherUser = await createTestUser()

      // 他のユーザーのトークンで削除を試みる
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${otherUser.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })

    test('異なるバイクの燃料ログIDを指定すると404となる', async () => {
      // 別のバイクと燃料ログを作成
      const otherBike = await createTestUserBike(token, {
        displacement: 400,
        nickname: '別のバイク',
        totalMileage: 500,
      })

      const otherFuelLogId = await createTestFuelLog(
        token,
        otherBike.myUserBikeId,
        {
          refueledAt: '2024-04-01T10:00:00.000Z',
          mileage: 600,
          amount: 8.0,
          totalPrice: 1200,
        }
      )

      // バイクAの燃料ログをバイクBのエンドポイントで削除しようとする
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: otherFuelLogId,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })
  })

  describe('PATCH /api/v1/user-bike/bike/:myUserBikeId/tourings/:touringId/spots/:spotId', () => {
    let token: string
    let myUserBikeId: string
    let touringId: string
    let spotId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 500,
        nickname: 'スポット更新テスト用バイク',
        totalMileage: 5000,
      })
      myUserBikeId = bike.myUserBikeId

      touringId = await createTestTouring(token, myUserBikeId, {
        title: 'スポット更新テスト用ツーリング',
        startDate: '2024-11-01T00:00:00.000Z',
        endDate: '2024-11-02T00:00:00.000Z',
      })

      spotId = await createTestSpot(token, myUserBikeId, touringId, {
        visitedAt: '2024-11-01T10:00:00.000Z',
        name: '更新前スポット',
        memo: '更新前メモ',
        latitude: 35.0,
        longitude: 135.0,
      })
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots/${spotId}`,
        'PATCH',
        { name: '更新後スポット' }
      )
    })

    test('更新項目が指定されていない場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots/${spotId}`,
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

    test('スポットの名前とメモを更新できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots/${spotId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: '更新後スポット',
            memo: '更新後メモ',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.spotId).toBe(spotId)
      expect(json.data.name).toBe('更新後スポット')
      expect(json.data.memo).toBe('更新後メモ')
    })

    test('スポットの位置情報を更新できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots/${spotId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: 36.5,
            longitude: 136.5,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.latitude).toBeCloseTo(36.5)
      expect(json.data.longitude).toBeCloseTo(136.5)
    })

    test('スポットの位置情報をnullで削除できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots/${spotId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude: null,
            longitude: null,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.latitude).toBeNull()
      expect(json.data.longitude).toBeNull()
    })

    test('存在しないスポットIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots/${randomUUID()}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: '更新後スポット',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect404Error(json)
    })
  })

  describe('POST /api/v1/user-bike/bike/:myUserBikeId/tourings/:touringId/spots (休憩登録)', () => {
    let token: string
    let myUserBikeId: string
    let touringId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      const bike = await createTestUserBike(token, {
        displacement: 500,
        nickname: '休憩テスト用バイク',
        totalMileage: 5000,
      })
      myUserBikeId = bike.myUserBikeId

      touringId = await createTestTouring(token, myUserBikeId, {
        title: '休憩テスト用ツーリング',
        startDate: '2024-11-01T00:00:00.000Z',
        endDate: '2024-11-02T00:00:00.000Z',
      })
    })

    test('type=BREAKで休憩を登録できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'BREAK',
            visitedAt: '2024-11-01T10:00:00.000Z',
            endAt: '2024-11-01T10:30:00.000Z',
            memo: '休憩メモ',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.type).toBe('BREAK')
      expect(json.data.endAt).not.toBeNull()
      expect(json.data.memo).toBe('休憩メモ')
    })

    test('type未指定の場合はSPOTとして登録される', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            visitedAt: '2024-11-01T10:00:00.000Z',
            name: 'テストスポット',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.type).toBe('SPOT')
      expect(json.data.endAt).toBeNull()
    })

    test('endAtがvisitedAtより前の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'BREAK',
            visitedAt: '2024-11-01T11:00:00.000Z',
            endAt: '2024-11-01T10:00:00.000Z',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expectValidationError(json)
    })

    test('休憩のendAtをPATCHで更新できる', async () => {
      const breakSpotId = await createTestSpot(token, myUserBikeId, touringId, {
        visitedAt: '2024-11-01T10:00:00.000Z',
        name: '休憩場所',
      })

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots/${breakSpotId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endAt: '2024-11-01T10:30:00.000Z',
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.endAt).not.toBeNull()
    })

    test('一覧取得でtypeとendAtが返される', async () => {
      await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'BREAK',
            visitedAt: '2024-11-01T10:00:00.000Z',
            endAt: '2024-11-01T10:30:00.000Z',
          }),
        }
      )

      const res = await app.request(
        `/api/v1/user-bike/bike/${myUserBikeId}/tourings/${touringId}/spots`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      const breakSpot = json.data.find(
        (s: { type: string }) => s.type === 'BREAK'
      )
      expect(breakSpot).toBeDefined()
      expect(breakSpot.endAt).not.toBeNull()
    })
  })

  describe('ゲストアカウント制限', () => {
    describe('バイク登録制限（1台まで）', () => {
      test('ゲストは1台目のバイクを登録できる', async () => {
        const { token } = await createGuestUser()

        const res = await app.request('/api/v1/user-bike/register', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displacement: 250,
            nickname: 'ゲストバイク1',
          }),
        })

        expect(res.status).toBe(201)
        const json = await res.json()
        expect(json.status).toBe('success')
      })

      test('ゲストは2台目のバイクを登録できない', async () => {
        const { token } = await createGuestUser()

        // 1台目
        await createTestUserBike(token, {
          displacement: 250,
          nickname: 'ゲストバイク1',
        })

        // 2台目（エラーになる）
        const res = await app.request('/api/v1/user-bike/register', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displacement: 400,
            nickname: 'ゲストバイク2',
          }),
        })

        const json = await res.json()
        expect(res.status).toBe(400)
        expect(json).toMatchObject({
          status: 'error',
          errorCode: 'INVALID_REQUEST',
          message: 'ゲストアカウントはバイクを1台まで登録できます',
        })
      })

      test('ゲストのバイクは isPublic が false に強制される', async () => {
        const { token } = await createGuestUser()

        const res = await app.request('/api/v1/user-bike/register', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displacement: 250,
            nickname: 'ゲストバイク',
            isPublic: true,
          }),
        })

        expect(res.status).toBe(201)
        const json = await res.json()
        const myUserBikeId = json.data.myUserBikeId

        const record = await prisma.tUserMyBike.findUnique({
          where: { id: myUserBikeId },
          select: { isPublic: true },
        })
        expect(record?.isPublic).toBe(false)
      })

      test('ゲストは PATCH でも isPublic が false に強制される', async () => {
        const { token } = await createGuestUser()
        const { myUserBikeId } = await createTestUserBike(token, {
          displacement: 250,
          nickname: 'ゲストバイク',
        })

        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              isPublic: true,
            }),
          }
        )

        expect(res.status).toBe(200)
        const json = await res.json()
        expect(json.data.isPublic).toBe(false)

        const record = await prisma.tUserMyBike.findUnique({
          where: { id: myUserBikeId },
          select: { isPublic: true },
        })
        expect(record?.isPublic).toBe(false)
      })
    })

    describe('給油履歴制限（5件まで）', () => {
      test('ゲストは5件まで給油履歴を登録できる', async () => {
        const { token } = await createGuestUser()
        const { myUserBikeId } = await createTestUserBike(token, {
          displacement: 250,
        })

        for (let i = 1; i <= 5; i++) {
          const res = await app.request(
            `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                refueledAt: `2024-01-0${i}T10:00:00.000Z`,
                mileage: i * 100,
                previousMileage: (i - 1) * 100,
                amount: 10,
                totalPrice: 1500,
              }),
            }
          )
          expect(res.status).toBe(201)
        }
      })

      test('ゲストは6件目の給油履歴を登録できない', async () => {
        const { token } = await createGuestUser()
        const { myUserBikeId } = await createTestUserBike(token, {
          displacement: 250,
        })

        // 5件登録
        await createMultipleFuelLogs(
          token,
          myUserBikeId,
          Array.from({ length: 5 }, (_, i) => ({
            refueledAt: `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`,
            mileage: (i + 1) * 100,
            previousMileage: i * 100,
            amount: 10,
            totalPrice: 1500,
          }))
        )

        // 6件目（エラー）
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/fuel-logs`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refueledAt: '2024-01-06T10:00:00.000Z',
              mileage: 600,
              previousMileage: 500,
              amount: 10,
              totalPrice: 1500,
            }),
          }
        )

        const json = await res.json()
        expect(res.status).toBe(400)
        expect(json).toMatchObject({
          status: 'error',
          errorCode: 'INVALID_REQUEST',
          message: 'ゲストアカウントは給油履歴を5件まで登録できます',
        })
      })
    })

    describe('ツーリング制限（2件まで）', () => {
      test('ゲストは2件までツーリングを登録できる', async () => {
        const { token } = await createGuestUser()
        const { myUserBikeId } = await createTestUserBike(token, {
          displacement: 250,
        })

        for (let i = 1; i <= 2; i++) {
          const res = await app.request(
            `/api/v1/user-bike/bike/${myUserBikeId}/tourings`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: `ゲストツーリング${i}`,
                startDate: `2024-01-0${i}T09:00:00.000Z`,
                endDate: `2024-01-0${i}T18:00:00.000Z`,
              }),
            }
          )
          expect(res.status).toBe(201)
        }
      })

      test('ゲストは3件目のツーリングを登録できない', async () => {
        const { token } = await createGuestUser()
        const { myUserBikeId } = await createTestUserBike(token, {
          displacement: 250,
        })

        // 2件登録
        await createMultipleTourings(
          token,
          myUserBikeId,
          Array.from({ length: 2 }, (_, i) => ({
            title: `ゲストツーリング${i + 1}`,
            startDate: `2024-01-0${i + 1}T09:00:00.000Z`,
            endDate: `2024-01-0${i + 1}T18:00:00.000Z`,
          }))
        )

        // 3件目（エラー）
        const res = await app.request(
          `/api/v1/user-bike/bike/${myUserBikeId}/tourings`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'ゲストツーリング3',
              startDate: '2024-01-03T09:00:00.000Z',
              endDate: '2024-01-03T18:00:00.000Z',
            }),
          }
        )

        const json = await res.json()
        expect(res.status).toBe(400)
        expect(json).toMatchObject({
          status: 'error',
          errorCode: 'INVALID_REQUEST',
          message: 'ゲストアカウントはツーリング履歴を2件まで登録できます',
        })
      })
    })
  })
})
