import { randomUUID } from 'crypto'
import { beforeAll, describe, expect, test } from 'vitest'
import { prisma } from '@packages/database'
import app from '../../../server'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import { handleRegisterByFirebase } from '../../helpers/firebaseTestToken'

describe('UserBike API Endpoints', () => {
  let token: string
  let bikeId: string
  let userId: string
  let createdSerialNumber: string
  let createdUserBikeId: string
  let createdMyUserBikeId: string

  beforeAll(async () => {
    const email = createRandomEmail()
    const credential = await handleRegisterByFirebase(email, 'password')
    token = await credential.user.getIdToken()

    const registerRes = await app.request('/api/v1/user/auth/register', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'テストユーザー_userBike',
      }),
    })

    const registerJson = await registerRes.json()
    userId = registerJson.data.userId

    const bike = await prisma.mBike.findFirst({ select: { id: true } })
    if (!bike) {
      throw new Error('事前にバイクのシードデータを投入してください')
    }
    bikeId = bike.id
  })

  test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
    const res = await app.request('/api/v1/user-bike/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bikeId,
        serialNumber: 'NO_TOKEN',
      }),
    })

    const json = await res.json()
    expect(res.status).toBe(401)
    expect(json).toEqual({
      status: 'error',
      errorCode: 'AUTH_FAILED',
      message: expect.any(String),
    })
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
    expect(json.status).toBe('error')
    expect(json.errorCode).toBe('VALIDATION_ERROR')
    expect(Array.isArray(json.details)).toBe(true)
    expect(json.details.length).toBeGreaterThan(0)
  })

  test('新規ユーザーバイクを登録できる', async () => {
    createdSerialNumber = `SN-${randomUUID()}`
    const purchaseDate = '2024-01-01T00:00:00.000Z'

    const res = await app.request('/api/v1/user-bike/register', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bikeId,
        serialNumber: createdSerialNumber,
        nickname: 'メインバイク',
        purchaseDate,
        purchasePrice: 500000,
        purchaseMileage: 1200,
        totalMileage: 1500,
      }),
    })

    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json).toEqual({
      status: 'success',
      data: {
        userBikeId: expect.any(String),
        myUserBikeId: expect.any(String),
      },
      message: expect.any(String),
    })

    createdUserBikeId = json.data.userBikeId
    createdMyUserBikeId = json.data.myUserBikeId

    const userBikeRecord = await prisma.tUserBike.findUnique({
      where: { id: json.data.userBikeId },
    })
    expect(userBikeRecord?.serialNumber).toBe(createdSerialNumber)
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

    const userBikeRecord = await prisma.tUserBike.findUnique({
      where: { id: json.data.userBikeId },
    })

    expect(userBikeRecord?.serialNumber).toBeNull()
    expect(userBikeRecord?.bikeId).toBe(bikeId)
  })

  test('同じ車台番号でも登録できる', async () => {
    const res = await app.request('/api/v1/user-bike/register', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bikeId,
        serialNumber: createdSerialNumber,
      }),
    })

    const json = await res.json()
    expect(res.status).toBe(201)
    expect(json.status).toBe('success')

    const userBikeRecord = await prisma.tUserBike.findUnique({
      where: { id: json.data.userBikeId },
    })

    expect(userBikeRecord?.serialNumber).toBe(createdSerialNumber)
    expect(userBikeRecord?.id).not.toBe(createdUserBikeId)
  })

  describe('GET /api/v1/user-bike/bikes', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/bikes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json).toEqual({
        status: 'error',
        errorCode: 'AUTH_FAILED',
        message: expect.any(String),
      })
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
        (bike: { userBikeId: string; createdAt: string; updatedAt: string }) => {
          expect(typeof bike.userBikeId).toBe('string')
          expect(typeof bike.createdAt).toBe('string')
          expect(typeof bike.updatedAt).toBe('string')
        }
      )
    })
  })

  describe('POST /api/v1/user-bike/bike/:myUserBikeId/fuel-logs', () => {
    let fuelLogMyUserBikeId: string

    beforeAll(async () => {
      const registerRes = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId,
          totalMileage: 800,
        }),
      })

      const registerJson = await registerRes.json()
      expect(registerRes.status).toBe(201)
      expect(registerJson.status).toBe('success')
      fuelLogMyUserBikeId = registerJson.data.myUserBikeId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${fuelLogMyUserBikeId}/fuel-logs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refueledAt: '2024-01-01T00:00:00.000Z',
            mileage: 1000,
            amount: 10,
            totalPrice: 1500,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('AUTH_FAILED')
    })

    test('必須項目が欠けている場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${fuelLogMyUserBikeId}/fuel-logs`,
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
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
      expect(Array.isArray(json.details)).toBe(true)
      expect(json.details.length).toBeGreaterThan(0)
    })

    test('燃料ログを登録し総走行距離を更新できる', async () => {
      const refueledAt = '2024-04-01T12:00:00.000Z'
      const mileage = 1500
      const amount = 12.5
      const totalPrice = 2300

      const res = await app.request(
        `/api/v1/user-bike/bike/${fuelLogMyUserBikeId}/fuel-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refueledAt,
            mileage,
            amount,
            totalPrice,
            updateTotalMileage: true,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.data).toEqual({
        fuelLogId: expect.any(String),
        refueledAt,
        mileage,
        amount,
        totalPrice,
      })

      const fuelLogRecord = await prisma.tUserMyBikeFuelLog.findUnique({
        where: { id: json.data.fuelLogId },
      })

      expect(fuelLogRecord?.userMyBikeId).toBe(fuelLogMyUserBikeId)
      expect(fuelLogRecord?.mileage).toBe(mileage)
      expect(fuelLogRecord?.price).toBe(totalPrice)
      expect(fuelLogRecord?.amount).toBeCloseTo(amount)
      expect(fuelLogRecord?.refueledAt.toISOString()).toBe(refueledAt)

      const myUserBikeRecord = await prisma.tUserMyBike.findUnique({
        where: { id: fuelLogMyUserBikeId },
      })

      expect(myUserBikeRecord?.totalMileage).toBe(mileage)
    })

    test('総走行距離が小さい値の場合は更新されない', async () => {
      const refueledAt = '2024-05-01T08:00:00.000Z'
      const mileage = 1200

      const res = await app.request(
        `/api/v1/user-bike/bike/${fuelLogMyUserBikeId}/fuel-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refueledAt,
            mileage,
            amount: 8,
            totalPrice: 1600,
            updateTotalMileage: true,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')

      const myUserBikeRecord = await prisma.tUserMyBike.findUnique({
        where: { id: fuelLogMyUserBikeId },
      })

      expect(myUserBikeRecord?.totalMileage).toBe(1500)
    })
  })
})
