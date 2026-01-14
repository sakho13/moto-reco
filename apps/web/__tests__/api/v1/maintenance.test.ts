import { beforeEach, describe, expect, test } from 'vitest'
import { createTestUser, testAuthRequired } from '../../helpers/authHelper'
import { createTestUserBike } from '../../helpers/bikeHelper'
import { expect404Error } from '../../helpers/validationHelper'
import { app } from '@/lib/api/server/app'

describe('Maintenance API Endpoints', () => {
  describe('GET /api/v1/maintenance/items', () => {
    let token: string
    let myUserBikeId: string
    let userBikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token

      // テストバイクを作成
      const bike = await createTestUserBike(token, {
        displacement: 400,
        serialNumber: 'TEST-MAINTENANCE',
        nickname: 'テストバイク',
        totalMileage: 10000,
      })
      myUserBikeId = bike.myUserBikeId
      userBikeId = bike.userBikeId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/maintenance/items?myUserBikeId=${myUserBikeId}`,
        'GET'
      )
    })

    test('myUserBikeIdが未指定の場合にエラーとなる', async () => {
      const res = await app.request('/api/v1/maintenance/items', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = await res.json()
      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.errorCode).toBe('INVALID_REQUEST')
      expect(json.message).toBe('myUserBikeIdを指定してください')
    })

    test('存在しないmyUserBikeIdを指定した場合にエラーとなる', async () => {
      const res = await app.request(
        '/api/v1/maintenance/items?myUserBikeId=invalid-id',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect404Error(json)
      expect(json.message).toBe('指定されたバイクが見つかりません')
    })

    test('他ユーザーのバイクIDを指定した場合にエラーとなる', async () => {
      // 別のユーザーとバイクを作成
      const otherUser = await createTestUser()
      const otherBike = await createTestUserBike(otherUser.token, {
        displacement: 250,
      })

      const res = await app.request(
        `/api/v1/maintenance/items?myUserBikeId=${otherBike.myUserBikeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect404Error(json)
      expect(json.message).toBe('指定されたバイクが見つかりません')
    })

    test('メンテナンス項目一覧を取得できる', async () => {
      const res = await app.request(
        `/api/v1/maintenance/items?myUserBikeId=${myUserBikeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.message).toBe('メンテナンス項目取得成功')
      expect(json.data).toBeDefined()
      expect(json.data.maintenanceItems).toBeDefined()
      expect(Array.isArray(json.data.maintenanceItems)).toBe(true)
      expect(json.data.maintenanceItems.length).toBe(20) // 保険除く20種類
    })

    test('メンテナンス項目の各項目に必要なフィールドが含まれている', async () => {
      const res = await app.request(
        `/api/v1/maintenance/items?myUserBikeId=${myUserBikeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      const items = json.data.maintenanceItems

      expect(items.length).toBeGreaterThan(0)

      // 各項目の構造を確認
      for (const item of items) {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('type')
        expect(item).toHaveProperty('category')
        expect(item).toHaveProperty('typeName')
        expect(item).toHaveProperty('categoryName')
        expect(item).toHaveProperty('recommendedMileageInterval')
        expect(item).toHaveProperty('recommendedPeriodMonths')
        expect(item).toHaveProperty('description')

        // 型の確認
        expect(typeof item.id).toBe('string')
        expect(typeof item.type).toBe('string')
        expect(typeof item.category).toBe('string')
        expect(typeof item.typeName).toBe('string')
        expect(typeof item.categoryName).toBe('string')
        expect(
          typeof item.recommendedMileageInterval === 'number' ||
            item.recommendedMileageInterval === null
        ).toBe(true)
        expect(
          typeof item.recommendedPeriodMonths === 'number' ||
            item.recommendedPeriodMonths === null
        ).toBe(true)
        expect(
          typeof item.description === 'string' || item.description === undefined
        ).toBe(true)

        // idの形式を確認（userBikeId_maintenanceType）
        expect(item.id).toMatch(new RegExp(`^${userBikeId}_[A-Z_]+$`))
      }
    })

    test('メンテナンス項目にカテゴリが正しく設定されている', async () => {
      const res = await app.request(
        `/api/v1/maintenance/items?myUserBikeId=${myUserBikeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      const items = json.data.maintenanceItems as Array<{ category: string }>

      const categories = new Set(items.map((item) => item.category))
      expect(categories.has('BRAKE')).toBe(true)
      expect(categories.has('ENGINE')).toBe(true)
      expect(categories.has('TRANSMISSION')).toBe(true)
      expect(categories.has('TIRE')).toBe(true)
      expect(categories.has('ELECTRIC')).toBe(true)
      expect(categories.has('INSURANCE')).toBe(false) // 保険は含まれない
    })

    test('特定のメンテナンス項目が含まれている', async () => {
      const res = await app.request(
        `/api/v1/maintenance/items?myUserBikeId=${myUserBikeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json()
      const items = json.data.maintenanceItems as Array<{ type: string }>

      const types = items.map((item) => item.type)

      // 主要なメンテナンス項目が含まれているか確認
      expect(types).toContain('ENGINE_OIL')
      expect(types).toContain('BRAKE_FLUID')
      expect(types).toContain('FRONT_TIRE')
      expect(types).toContain('REAR_TIRE')
      expect(types).toContain('BATTERY')
      expect(types).toContain('DRIVE_CHAIN')
    })
  })
})
