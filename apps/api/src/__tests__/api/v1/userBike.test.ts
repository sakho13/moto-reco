import { describe, expect, test, beforeAll } from 'vitest'
import app from '../../../server'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import { handleRegisterByFirebase } from '../../helpers/firebaseTestToken'

describe('User Bike API Endpoints', () => {
  let token: string
  let bikeId: string

  beforeAll(async () => {
    // テスト用のユーザー登録とトークン取得
    const email = createRandomEmail()
    const credential = await handleRegisterByFirebase(email, 'password')
    token = await credential.user.getIdToken()
    await app.request('/api/v1/user/auth/register', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'テストユーザー_userBike',
      }),
    })

    // APIからバイク一覧を取得して、テスト用のバイクIDを取得
    const bikesRes = await app.request('/api/v1/bikes/search', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const bikesJson = await bikesRes.json()
    if (bikesRes.status !== 200 || bikesJson.status !== 'success') {
      throw new Error('バイク一覧の取得に失敗しました')
    }

    if (bikesJson.data.bikes.length === 0) {
      throw new Error(
        'バイクデータが見つかりません。シードデータを実行してください。'
      )
    }
    bikeId = bikesJson.data.bikes[0].bikeId
  })

  describe('POST /api/v1/user-bike/register', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: bikeId,
          serialNumber: 'TEST-SERIAL-001',
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('AUTH_FAILED')
    })

    test('bikeIdが未指定の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serialNumber: 'TEST-SERIAL-002',
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
    })

    test('serialNumberが未指定の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: bikeId,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
    })

    test('serialNumberが空文字の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: bikeId,
          serialNumber: '',
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
    })

    test('serialNumberが50文字を超える場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: bikeId,
          serialNumber: 'A'.repeat(51),
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
    })

    test('存在しないbikeIdの場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: 'nonexistent-bike-id',
          serialNumber: 'TEST-SERIAL-003',
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(404)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('NOT_FOUND')
    })

    test('必須項目のみでバイクが登録できる', async () => {
      const uniqueSerialNumber = `TEST-SERIAL-${Date.now()}-001`

      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: bikeId,
          serialNumber: uniqueSerialNumber,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.message).toBe('バイク登録成功')
      expect(json.data.myUserBikeId).toBeDefined()
      expect(json.data.userBikeId).toBeDefined()
      expect(json.data.bikeId).toBe(bikeId)
      expect(json.data.serialNumber).toBe(uniqueSerialNumber)
      expect(json.data.nickname).toBeNull()
      expect(json.data.bike).toBeDefined()
      expect(json.data.bike.modelName).toBeDefined()
      expect(json.data.bike.manufacturer).toBeDefined()
      expect(json.data.bike.displacement).toBeDefined()
      expect(json.data.bike.modelYear).toBeDefined()
    })

    test('全項目を指定してバイクが登録できる', async () => {
      const uniqueSerialNumber = `TEST-SERIAL-${Date.now()}-002`

      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: bikeId,
          serialNumber: uniqueSerialNumber,
          nickname: 'マイバイク',
          purchaseDate: '2024-01-15',
          purchasePrice: 500000,
          purchaseMileage: 1000,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.data.serialNumber).toBe(uniqueSerialNumber)
      expect(json.data.nickname).toBe('マイバイク')
    })

    test('同じ車台番号で再度登録するとエラーとなる', async () => {
      const uniqueSerialNumber = `TEST-SERIAL-${Date.now()}-003`

      // 1回目の登録（成功）
      const res1 = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: bikeId,
          serialNumber: uniqueSerialNumber,
        }),
      })
      expect(res1.status).toBe(201)

      // 2回目の登録（エラー）
      const res2 = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: bikeId,
          serialNumber: uniqueSerialNumber,
        }),
      })

      const json = await res2.json()
      expect(res2.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('INVALID_REQUEST')
      expect(json.message).toContain('車台番号は既に登録されています')
    })

    test('nicknameが50文字を超える場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: bikeId,
          serialNumber: `TEST-SERIAL-${Date.now()}-004`,
          nickname: 'A'.repeat(51),
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
    })

    test('purchasePriceが負の値の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: bikeId,
          serialNumber: `TEST-SERIAL-${Date.now()}-005`,
          purchasePrice: -1,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
    })

    test('purchaseMileageが負の値の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bikeId: bikeId,
          serialNumber: `TEST-SERIAL-${Date.now()}-006`,
          purchaseMileage: -1,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
    })
  })
})
