import { randomUUID } from 'crypto'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { prisma } from '@repo/database'
import { createTestUser, testAuthRequired } from '../../helpers/authHelper'
import { createTestUserBike, getTestBikeId } from '../../helpers/bikeHelper'
import {
  createTestFuelLog,
  createMultipleFuelLogs,
} from '../../helpers/fuelLogHelper'
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

      const myUserBikeRecord = await prisma.tUserMyBike.findUnique({
        where: { id: json.data.myUserBikeId },
      })
      expect(myUserBikeRecord?.userId).toBe(userId)
      expect(myUserBikeRecord?.totalMileage).toBe(1500)
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

      expect(myUserBikeRecord?.nickname).toBe(updatedNickname)
      expect(myUserBikeRecord?.purchaseDate?.toISOString()).toBe(purchaseDate)
      expect(myUserBikeRecord?.purchasePrice).toBe(450000)
      expect(myUserBikeRecord?.purchaseMileage).toBe(1300)
      expect(myUserBikeRecord?.totalMileage).toBe(2100)
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
            amount: 10.5,
            totalPrice: 1800,
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
          amount: 10.5,
          totalPrice: 1800,
        },
        message: '燃料ログ登録成功',
      })

      const fuelLogRecord = await prisma.tUserMyBikeFuelLog.findUnique({
        where: { id: json.data.fuelLogId },
      })
      expect(fuelLogRecord?.userMyBikeId).toBe(myUserBikeId)
      expect(fuelLogRecord?.mileage).toBe(2500)
      expect(fuelLogRecord?.amount).toBe(10.5)
      expect(fuelLogRecord?.price).toBe(1800)
      expect(fuelLogRecord?.refueledAt.toISOString()).toBe(refueledAt)
    })

    test('updateTotalMileageがtrueの場合に総走行距離が更新される', async () => {
      const myUserBikeBefore = await prisma.tUserMyBike.findUnique({
        where: { id: myUserBikeId },
      })
      const currentMileage = myUserBikeBefore?.totalMileage ?? 0

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
            amount: 12.0,
            totalPrice: 2000,
            updateTotalMileage: true,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.mileage).toBe(newMileage)

      const myUserBikeAfter = await prisma.tUserMyBike.findUnique({
        where: { id: myUserBikeId },
      })
      expect(myUserBikeAfter?.totalMileage).toBe(newMileage)
    })

    test('updateTotalMileageがtrueでも現在値より小さい場合は更新されない', async () => {
      const myUserBikeBefore = await prisma.tUserMyBike.findUnique({
        where: { id: myUserBikeId },
      })
      const currentMileage = myUserBikeBefore?.totalMileage ?? 0

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
            amount: 8.0,
            totalPrice: 1400,
            updateTotalMileage: true,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data.mileage).toBe(smallerMileage)

      const myUserBikeAfter = await prisma.tUserMyBike.findUnique({
        where: { id: myUserBikeId },
      })
      expect(myUserBikeAfter?.totalMileage).toBe(currentMileage)
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      json.data.forEach((log: any) => {
        expect(typeof log.fuelLogId).toBe('string')
        expect(typeof log.refueledAt).toBe('string')
        expect(typeof log.mileage).toBe('number')
        expect(typeof log.amount).toBe('number')
        expect(typeof log.totalPrice).toBe('number')

        expect(new Date(log.refueledAt).toISOString()).toBe(log.refueledAt)
      })
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
            amount: 12.5,
            totalPrice: 2000,
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
          amount: 12.5,
          totalPrice: 2000,
        },
        message: '燃料ログ更新成功',
      })

      // DBに反映されているか確認
      const fuelLogRecord = await prisma.tUserMyBikeFuelLog.findUnique({
        where: { id: fuelLogId },
      })
      expect(fuelLogRecord?.mileage).toBe(2000)
      expect(fuelLogRecord?.amount).toBe(12.5)
      expect(fuelLogRecord?.price).toBe(2000)
      expect(fuelLogRecord?.refueledAt.toISOString()).toBe(refueledAt)
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
  })
})
