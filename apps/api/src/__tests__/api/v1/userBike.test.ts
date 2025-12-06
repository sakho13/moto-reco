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
          userBikeId: bikeId,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(401)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('AUTH_FAILED')
    })

    test('userBikeIdが未指定の場合にエラーとなる', async () => {
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
    })

    test('存在しないuserBikeIdの場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userBikeId: 'nonexistent-bike-id',
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(404)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('NOT_FOUND')
    })

    test('必須項目のみでバイクが登録できる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userBikeId: bikeId,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.message).toBe('ユーザー所有バイク登録成功')
      expect(json.data.userBikeId).toBeDefined()
      expect(json.data.bikeId).toBe(bikeId)
      expect(json.data.modelName).toBeDefined()
      expect(json.data.manufacturerName).toBeDefined()
      expect(json.data.displacement).toBeDefined()
      expect(json.data.modelYear).toBeDefined()
      expect(json.data.nickname).toBeNull()
      expect(json.data.purchaseDate).toBeNull()
      expect(json.data.totalMileage).toBe(0)
      expect(json.data.createdAt).toBeDefined()
      expect(json.data.updatedAt).toBeDefined()
    })

    test('全項目を指定してバイクが登録できる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userBikeId: bikeId,
          nickname: 'マイバイク',
          purchaseDate: '2024-01-15',
          mileage: 1000,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.data.nickname).toBe('マイバイク')
      expect(json.data.purchaseDate).toBeDefined()
      expect(json.data.totalMileage).toBe(1000)
    })

    test('nicknameが50文字を超える場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userBikeId: bikeId,
          nickname: 'A'.repeat(51),
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
    })

    test('mileageが負の値の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/user-bike/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userBikeId: bikeId,
          mileage: -1,
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('VALIDATION_ERROR')
    })
  })
})
