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
})
