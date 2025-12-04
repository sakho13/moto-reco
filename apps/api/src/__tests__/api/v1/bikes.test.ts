import { describe, expect, test, beforeAll } from 'vitest'
import { prisma } from '@packages/database'
import app from '../../../server'
import { createRandomEmail } from '../../helpers/createRandomEmail'
import { handleRegisterByFirebase } from '../../helpers/firebaseTestToken'

describe('Bikes API Endpoints', () => {
  let token: string
  let manufacturerId: string

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
        name: 'テストユーザー_bikes',
      }),
    })

    // テスト用のメーカーとバイクを作成
    const manufacturer = await prisma.mManufacturer.create({
      data: {
        name: 'テストメーカー',
        nameEn: 'Test Manufacturer',
        country: 'Japan',
      },
    })
    manufacturerId = manufacturer.id

    // テスト用のバイクを複数作成
    await prisma.mBike.createMany({
      data: [
        {
          manufacturerId,
          modelName: 'CB400SF',
          displacement: 400,
          modelYear: 2020,
          modelCode: 'NC42',
          releaseYear: 2020,
          releaseMonth: 4,
        },
        {
          manufacturerId,
          modelName: 'CB1300SF',
          displacement: 1300,
          modelYear: 2021,
          modelCode: 'SC54',
          releaseYear: 2021,
          releaseMonth: 3,
        },
        {
          manufacturerId,
          modelName: 'Ninja 250',
          displacement: 250,
          modelYear: 2019,
          modelCode: 'EX250',
          releaseYear: 2019,
          releaseMonth: 2,
        },
      ],
    })
  })

  describe('GET /api/v1/bikes/search', () => {
    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/bikes/search', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const json = await res.json()
      expect(json).toEqual({
        status: 'error',
        errorCode: 'AUTH_FAILED',
        message: expect.any(String),
      })
      expect(res.status).toBe(401)
    })

    test('パラメータなしで全バイクを取得できる', async () => {
      const res = await app.request('/api/v1/bikes/search', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json).toEqual({
        status: 'success',
        data: {
          bikes: expect.arrayContaining([
            expect.objectContaining({
              bikeId: expect.any(String),
              manufacturerId: expect.any(String),
              manufacturer: expect.any(String),
              modelName: expect.any(String),
              displacement: expect.any(Number),
              modelYear: expect.any(Number),
            }),
          ]),
        },
        message: 'バイク検索成功',
      })
      expect(json.data.bikes.length).toBeGreaterThan(0)
    })

    test('モデル名で部分一致検索ができる', async () => {
      const res = await app.request('/api/v1/bikes/search?model-name=CB', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data.bikes.length).toBeGreaterThan(0)
      json.data.bikes.forEach((bike: { modelName: string }) => {
        expect(bike.modelName.toLowerCase()).toContain('cb')
      })
    })

    test('排気量の範囲で検索ができる', async () => {
      const res = await app.request(
        '/api/v1/bikes/search?displacement-min=300&displacement-max=500',
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
      json.data.bikes.forEach(
        (bike: { displacement: number }) => {
          expect(bike.displacement).toBeGreaterThanOrEqual(300)
          expect(bike.displacement).toBeLessThanOrEqual(500)
        }
      )
    })

    test('モデル年の範囲で検索ができる', async () => {
      const res = await app.request(
        '/api/v1/bikes/search?model-year-min=2020&model-year-max=2021',
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
      json.data.bikes.forEach((bike: { modelYear: number }) => {
        expect(bike.modelYear).toBeGreaterThanOrEqual(2020)
        expect(bike.modelYear).toBeLessThanOrEqual(2021)
      })
    })

    test('メーカーIDで検索ができる（eq演算子）', async () => {
      const res = await app.request(
        `/api/v1/bikes/search?mf-op=eq&mf=${manufacturerId}`,
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
      json.data.bikes.forEach(
        (bike: { manufacturerId: string }) => {
          expect(bike.manufacturerId).toBe(manufacturerId)
        }
      )
    })

    test('ページネーションが動作する', async () => {
      const res1 = await app.request(
        '/api/v1/bikes/search?page=1&page-size=1',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const json1 = await res1.json()
      expect(res1.status).toBe(200)
      expect(json1.data.bikes.length).toBe(1)

      const res2 = await app.request(
        '/api/v1/bikes/search?page=2&page-size=1',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const json2 = await res2.json()
      expect(res2.status).toBe(200)
      if (json2.data.bikes.length > 0) {
        expect(json1.data.bikes[0].bikeId).not.toBe(json2.data.bikes[0].bikeId)
      }
    })

    test('ソート機能が動作する（排気量昇順）', async () => {
      const res = await app.request(
        '/api/v1/bikes/search?sort-by=displacement&sort-order=asc',
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

      // 排気量が昇順になっているか確認
      for (let i = 0; i < json.data.bikes.length - 1; i++) {
        expect(json.data.bikes[i].displacement).toBeLessThanOrEqual(
          json.data.bikes[i + 1].displacement
        )
      }
    })

    test('ソート機能が動作する（排気量降順）', async () => {
      const res = await app.request(
        '/api/v1/bikes/search?sort-by=displacement&sort-order=desc',
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

      // 排気量が降順になっているか確認
      for (let i = 0; i < json.data.bikes.length - 1; i++) {
        expect(json.data.bikes[i].displacement).toBeGreaterThanOrEqual(
          json.data.bikes[i + 1].displacement
        )
      }
    })

    test('複合条件で検索ができる', async () => {
      const res = await app.request(
        `/api/v1/bikes/search?mf-op=eq&mf=${manufacturerId}&displacement-min=300&model-year-min=2020&sort-by=modelYear&sort-order=asc`,
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
      json.data.bikes.forEach(
        (bike: { manufacturerId: string; displacement: number; modelYear: number }) => {
          expect(bike.manufacturerId).toBe(manufacturerId)
          expect(bike.displacement).toBeGreaterThanOrEqual(300)
          expect(bike.modelYear).toBeGreaterThanOrEqual(2020)
        }
      )
    })
  })
})
