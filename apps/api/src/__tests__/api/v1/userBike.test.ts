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
  const updatedNickname = 'アップデート後のバイク'

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
  })

  describe('GET /api/v1/user-bike/bike/:myUserBikeId', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${createdMyUserBikeId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json).toEqual({
        status: 'error',
        errorCode: 'AUTH_FAILED',
        message: expect.any(String),
      })
    })

    test('ユーザー所有バイクの詳細を取得できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${createdMyUserBikeId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.message).toBe('ユーザー所有バイク詳細取得成功')
      expect(json.data.userBikeId).toBe(createdUserBikeId)
      expect(json.data.myUserBikeId).toBe(createdMyUserBikeId)
      expect(json.data.nickname).toBe('メインバイク')
      expect(json.data.purchaseDate).toBe('2024-01-01T00:00:00.000Z')
      expect(json.data.totalMileage).toBe(1500)
      expect(json.data.purchasePrice).toBe(500000)
      expect(json.data.purchaseMileage).toBe(1200)
    })
  })

  describe('PATCH /api/v1/user-bike/bike/:myUserBikeId', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${createdMyUserBikeId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nickname: updatedNickname,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json).toEqual({
        status: 'error',
        errorCode: 'AUTH_FAILED',
        message: expect.any(String),
      })
    })

    test('不正な入力の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${createdMyUserBikeId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            totalMileage: -100,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
      expect(Array.isArray(json.details)).toBe(true)
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
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('NOT_FOUND')
    })

    test('ユーザー所有バイクの情報を更新できる', async () => {
      const purchaseDate = '2024-02-02T00:00:00.000Z'
      const res = await app.request(
        `/api/v1/user-bike/bike/${createdMyUserBikeId}`,
        {
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
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data.nickname).toBe(updatedNickname)
      expect(json.data.purchaseDate).toBe(purchaseDate)
      expect(json.data.purchasePrice).toBe(450000)
      expect(json.data.purchaseMileage).toBe(1300)
      expect(json.data.totalMileage).toBe(2100)

      const myUserBikeRecord = await prisma.tUserMyBike.findUnique({
        where: { id: createdMyUserBikeId },
      })

      expect(myUserBikeRecord?.nickname).toBe(updatedNickname)
      expect(myUserBikeRecord?.purchaseDate?.toISOString()).toBe(purchaseDate)
      expect(myUserBikeRecord?.purchasePrice).toBe(450000)
      expect(myUserBikeRecord?.purchaseMileage).toBe(1300)
      expect(myUserBikeRecord?.totalMileage).toBe(2100)
    })
  })

  describe('POST /api/v1/user-bike/bike/:myUserBikeId/fuel-logs', () => {
    let fuelLogTestMyUserBikeId: string

    beforeAll(async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId,
          nickname: '燃料ログテスト用バイク',
          totalMileage: 2000,
        }),
      })

      const json = await res.json()
      fuelLogTestMyUserBikeId = json.data.myUserBikeId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${fuelLogTestMyUserBikeId}/fuel-logs`,
        {
          method: 'POST',
          headers: {
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
      expect(res.status).toBe(401)
      expect(json).toEqual({
        status: 'error',
        errorCode: 'AUTH_FAILED',
        message: expect.any(String),
      })
    })

    test('必須項目が欠けている場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${fuelLogTestMyUserBikeId}/fuel-logs`,
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

    test('不正な入力の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${fuelLogTestMyUserBikeId}/fuel-logs`,
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
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
      expect(Array.isArray(json.details)).toBe(true)
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
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('NOT_FOUND')
    })

    test('燃料ログを登録できる', async () => {
      const refueledAt = '2024-03-01T10:00:00.000Z'
      const res = await app.request(
        `/api/v1/user-bike/bike/${fuelLogTestMyUserBikeId}/fuel-logs`,
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
      expect(fuelLogRecord?.userMyBikeId).toBe(fuelLogTestMyUserBikeId)
      expect(fuelLogRecord?.mileage).toBe(2500)
      expect(fuelLogRecord?.amount).toBe(10.5)
      expect(fuelLogRecord?.price).toBe(1800)
      expect(fuelLogRecord?.refueledAt.toISOString()).toBe(refueledAt)
    })

    test('updateTotalMileageがtrueの場合に総走行距離が更新される', async () => {
      const myUserBikeBefore = await prisma.tUserMyBike.findUnique({
        where: { id: fuelLogTestMyUserBikeId },
      })
      const currentMileage = myUserBikeBefore?.totalMileage ?? 0

      const newMileage = currentMileage + 500
      const refueledAt = '2024-03-15T10:00:00.000Z'

      const res = await app.request(
        `/api/v1/user-bike/bike/${fuelLogTestMyUserBikeId}/fuel-logs`,
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
        where: { id: fuelLogTestMyUserBikeId },
      })
      expect(myUserBikeAfter?.totalMileage).toBe(newMileage)
    })

    test('updateTotalMileageがtrueでも現在値より小さい場合は更新されない', async () => {
      const myUserBikeBefore = await prisma.tUserMyBike.findUnique({
        where: { id: fuelLogTestMyUserBikeId },
      })
      const currentMileage = myUserBikeBefore?.totalMileage ?? 0

      const smallerMileage = currentMileage - 100
      const refueledAt = '2024-02-01T10:00:00.000Z'

      const res = await app.request(
        `/api/v1/user-bike/bike/${fuelLogTestMyUserBikeId}/fuel-logs`,
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
        where: { id: fuelLogTestMyUserBikeId },
      })
      expect(myUserBikeAfter?.totalMileage).toBe(currentMileage)
    })
  })

  describe('GET /api/v1/user-bike/bike/:myUserBikeId/fuel-logs', () => {
    let getFuelLogsTestMyUserBikeId: string
    const fuelLogIds: string[] = []

    beforeAll(async () => {
      const bikeRes = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId,
          nickname: '燃料ログ一覧テスト用バイク',
          totalMileage: 1000,
        }),
      })
      const bikeJson = await bikeRes.json()
      getFuelLogsTestMyUserBikeId = bikeJson.data.myUserBikeId

      const fuelLogsData = [
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
      ]

      for (const data of fuelLogsData) {
        const res = await app.request(
          `/api/v1/user-bike/bike/${getFuelLogsTestMyUserBikeId}/fuel-logs`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        )
        const json = await res.json()
        fuelLogIds.push(json.data.fuelLogId)
      }
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${getFuelLogsTestMyUserBikeId}/fuel-logs`,
        {
          method: 'GET',
        }
      )

      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json).toEqual({
        status: 'error',
        errorCode: 'AUTH_FAILED',
        message: expect.any(String),
      })
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
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('NOT_FOUND')
    })

    test('燃料ログ一覧を取得できる（デフォルトパラメータ）', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${getFuelLogsTestMyUserBikeId}/fuel-logs`,
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
        `/api/v1/user-bike/bike/${getFuelLogsTestMyUserBikeId}/fuel-logs?page=2&per-size=2`,
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
        `/api/v1/user-bike/bike/${getFuelLogsTestMyUserBikeId}/fuel-logs?sort-by=mileage&sort-order=asc`,
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
        `/api/v1/user-bike/bike/${getFuelLogsTestMyUserBikeId}/fuel-logs?sort-by=refueled-at&sort-order=asc`,
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
      const bikeRes = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId,
          nickname: '燃料ログなしバイク',
          totalMileage: 100,
        }),
      })
      const bikeJson = await bikeRes.json()
      const emptyBikeId = bikeJson.data.myUserBikeId

      const res = await app.request(
        `/api/v1/user-bike/bike/${emptyBikeId}/fuel-logs`,
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
        `/api/v1/user-bike/bike/${getFuelLogsTestMyUserBikeId}/fuel-logs?page=-1&per-size=200`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
    })

    test('レスポンスの形式が正しい', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${getFuelLogsTestMyUserBikeId}/fuel-logs`,
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
    let updateTestMyUserBikeId: string
    let updateTestFuelLogId: string

    beforeAll(async () => {
      // テスト用バイク作成
      const bikeRes = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId,
          nickname: '燃料ログ更新テスト用バイク',
          totalMileage: 1000,
        }),
      })
      const bikeJson = await bikeRes.json()
      updateTestMyUserBikeId = bikeJson.data.myUserBikeId

      // テスト用燃料ログ作成
      const fuelLogRes = await app.request(
        `/api/v1/user-bike/bike/${updateTestMyUserBikeId}/fuel-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refueledAt: '2024-03-01T10:00:00.000Z',
            mileage: 1500,
            amount: 10.0,
            totalPrice: 1500,
          }),
        }
      )
      const fuelLogJson = await fuelLogRes.json()
      updateTestFuelLogId = fuelLogJson.data.fuelLogId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${updateTestMyUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: updateTestFuelLogId,
            mileage: 2000,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json).toEqual({
        status: 'error',
        errorCode: 'AUTH_FAILED',
        message: expect.any(String),
      })
    })

    test('fuelLogIdが未指定の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${updateTestMyUserBikeId}/fuel-logs`,
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
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
      expect(Array.isArray(json.details)).toBe(true)
    })

    test('更新項目が1つも指定されていない場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${updateTestMyUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: updateTestFuelLogId,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
      expect(Array.isArray(json.details)).toBe(true)
      expect(json.details.some((d: { message: string }) => d.message === 'いずれかの更新項目を指定してください')).toBe(true)
    })

    test('不正な入力の場合はバリデーションエラーとなる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${updateTestMyUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: updateTestFuelLogId,
            mileage: -100,
            amount: 0,
            totalPrice: -500,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
      expect(Array.isArray(json.details)).toBe(true)
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
            fuelLogId: updateTestFuelLogId,
            mileage: 2000,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('NOT_FOUND')
    })

    test('存在しない燃料ログIDの場合は404となる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${updateTestMyUserBikeId}/fuel-logs`,
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
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('NOT_FOUND')
    })

    test('燃料ログのすべてのフィールドを更新できる', async () => {
      const refueledAt = '2024-03-15T15:30:00.000Z'
      const res = await app.request(
        `/api/v1/user-bike/bike/${updateTestMyUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: updateTestFuelLogId,
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
          fuelLogId: updateTestFuelLogId,
          refueledAt,
          mileage: 2000,
          amount: 12.5,
          totalPrice: 2000,
        },
        message: '燃料ログ更新成功',
      })

      // DBに反映されているか確認
      const fuelLogRecord = await prisma.tUserMyBikeFuelLog.findUnique({
        where: { id: updateTestFuelLogId },
      })
      expect(fuelLogRecord?.mileage).toBe(2000)
      expect(fuelLogRecord?.amount).toBe(12.5)
      expect(fuelLogRecord?.price).toBe(2000)
      expect(fuelLogRecord?.refueledAt.toISOString()).toBe(refueledAt)
    })

    test('部分更新: 走行距離のみを更新できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${updateTestMyUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: updateTestFuelLogId,
            mileage: 2100,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.mileage).toBe(2100)
      expect(json.data.amount).toBe(12.5)
      expect(json.data.totalPrice).toBe(2000)
    })

    test('部分更新: 給油量と価格のみを更新できる', async () => {
      const res = await app.request(
        `/api/v1/user-bike/bike/${updateTestMyUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: updateTestFuelLogId,
            amount: 15.0,
            totalPrice: 2500,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data.amount).toBe(15.0)
      expect(json.data.totalPrice).toBe(2500)
      expect(json.data.mileage).toBe(2100)
    })

    test('他のユーザーのバイクの燃料ログを更新しようとすると404となる', async () => {
      // 別のユーザーを作成
      const otherEmail = createRandomEmail()
      const otherCredential = await handleRegisterByFirebase(
        otherEmail,
        'password'
      )
      const otherToken = await otherCredential.user.getIdToken()

      await app.request('/api/v1/user/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${otherToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'テストユーザー_other',
        }),
      })

      // 他のユーザーのトークンで更新を試みる
      const res = await app.request(
        `/api/v1/user-bike/bike/${updateTestMyUserBikeId}/fuel-logs`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${otherToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fuelLogId: updateTestFuelLogId,
            mileage: 3000,
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(404)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('NOT_FOUND')
    })

    test('異なるバイクの燃料ログIDを指定すると404となる', async () => {
      // 別のバイクと燃料ログを作成
      const otherBikeRes = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId,
          nickname: '別のバイク',
          totalMileage: 500,
        }),
      })
      const otherBikeJson = await otherBikeRes.json()
      const otherBikeId = otherBikeJson.data.myUserBikeId

      const otherFuelLogRes = await app.request(
        `/api/v1/user-bike/bike/${otherBikeId}/fuel-logs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refueledAt: '2024-04-01T10:00:00.000Z',
            mileage: 600,
            amount: 8.0,
            totalPrice: 1200,
          }),
        }
      )
      const otherFuelLogJson = await otherFuelLogRes.json()
      const otherFuelLogId = otherFuelLogJson.data.fuelLogId

      // バイクAの燃料ログをバイクBのエンドポイントで更新しようとする
      const res = await app.request(
        `/api/v1/user-bike/bike/${updateTestMyUserBikeId}/fuel-logs`,
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
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('NOT_FOUND')
    })
  })
})
