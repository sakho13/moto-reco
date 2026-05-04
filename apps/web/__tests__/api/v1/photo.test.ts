import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { prisma } from '@repo/database'
import { app } from '@/lib/api/server/app'
import {
  createTestUser,
  testAuthRequired,
} from '../../helpers/authHelper'
import { getTestBikeId, createTestUserBike } from '../../helpers/bikeHelper'
import {
  createTestTouringPhoto,
  createTestSpotPhoto,
} from '../../helpers/photoHelper'
import { createTestTouring, createTestSpot } from '../../helpers/touringHelper'

vi.mock('@/lib/firebase/adminStorage', () => ({
  getFirebaseAdminStorage: () => ({
    bucket: () => ({
      file: () => ({
        getSignedUrl: vi
          .fn()
          .mockResolvedValue(['https://storage.example.com/signed-test.jpg']),
        delete: vi.fn().mockResolvedValue([{}]),
      }),
    }),
  }),
  getStorageBucketName: () => 'test-bucket',
}))

describe('Photo API Endpoints', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // -----------------------------------------------------------------------
  // POST /api/v1/photo/upload-url
  // -----------------------------------------------------------------------
  describe('POST /api/v1/photo/upload-url', () => {
    let token: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/photo/upload-url', 'POST', {
        contentType: 'image/jpeg',
        count: 1,
      })
    })

    test('count=2 で2件の署名付きURLを返す', async () => {
      const res = await app.request('/api/v1/photo/upload-url', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentType: 'image/jpeg', count: 2 }),
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data).toHaveLength(2)
      expect(json.data[0]).toMatchObject({
        signedUploadUrl: expect.any(String),
        photoPath: expect.stringMatching(/^users\//),
      })
    })

    test('不正な contentType はバリデーションエラーになる', async () => {
      const res = await app.request('/api/v1/photo/upload-url', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentType: 'image/gif', count: 1 }),
      })

      expect(res.status).toBe(400)
    })

    test('count=0 はバリデーションエラーになる', async () => {
      const res = await app.request('/api/v1/photo/upload-url', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentType: 'image/jpeg', count: 0 }),
      })

      expect(res.status).toBe(400)
    })

    test('count=11（上限超過）はバリデーションエラーになる', async () => {
      const res = await app.request('/api/v1/photo/upload-url', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentType: 'image/jpeg', count: 11 }),
      })

      expect(res.status).toBe(400)
    })
  })

  // -----------------------------------------------------------------------
  // POST /api/v1/photo/touring/:touringId
  // -----------------------------------------------------------------------
  describe('POST /api/v1/photo/touring/:touringId', () => {
    let token: string
    let userId: string
    let myUserBikeId: string
    let touringId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token
      userId = user.userId
      const bikeId = await getTestBikeId()
      const bike = await createTestUserBike(token, { bikeId })
      myUserBikeId = bike.myUserBikeId
      touringId = await createTestTouring(token, myUserBikeId, {
        title: 'テストツーリング',
        startDate: '2024-06-01T09:00:00.000Z',
        endDate: '2024-06-01T18:00:00.000Z',
      })
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/photo/touring/${touringId}`,
        'POST',
        {
          photos: [
            {
              photoPath: `users/${userId}/photos/test.jpg`,
              takenAt: '2024-06-01T10:00:00.000Z',
            },
          ],
        }
      )
    })

    test('1枚の写真を登録するとDBにレコードが作成される', async () => {
      const photoPath = `users/${userId}/photos/test.jpg`

      const res = await app.request(
        `/api/v1/photo/touring/${touringId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photos: [
              {
                photoPath,
                takenAt: '2024-06-01T10:00:00.000Z',
              },
            ],
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.data).toHaveLength(1)
      expect(json.data[0]).toMatchObject({
        photoId: expect.any(String),
        photoUrl: expect.any(String),
        orderIndex: 0,
      })

      const dbPhoto = await prisma.tUserMyBikePhoto.findFirst({
        where: { userId, storagePath: photoPath },
      })
      expect(dbPhoto).not.toBeNull()
    })

    test('複数枚登録でorderIndexが0から連番になる', async () => {
      const res = await app.request(
        `/api/v1/photo/touring/${touringId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photos: [
              {
                photoPath: `users/${userId}/photos/a.jpg`,
                takenAt: '2024-06-01T10:00:00.000Z',
              },
              {
                photoPath: `users/${userId}/photos/b.jpg`,
                takenAt: '2024-06-01T11:00:00.000Z',
              },
              {
                photoPath: `users/${userId}/photos/c.jpg`,
                takenAt: '2024-06-01T12:00:00.000Z',
              },
            ],
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data[0].orderIndex).toBe(0)
      expect(json.data[1].orderIndex).toBe(1)
      expect(json.data[2].orderIndex).toBe(2)
    })

    test('既存の写真がある状態で追加するとorderIndexが継続する', async () => {
      await createTestTouringPhoto({ userId, touringId, orderIndex: 0 })
      await createTestTouringPhoto({ userId, touringId, orderIndex: 1 })

      const res = await app.request(
        `/api/v1/photo/touring/${touringId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photos: [
              {
                photoPath: `users/${userId}/photos/new.jpg`,
                takenAt: '2024-06-01T13:00:00.000Z',
              },
            ],
          }),
        }
      )

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data[0].orderIndex).toBe(2)
    })

    test('存在しないtouringIdは404になる', async () => {
      const res = await app.request(
        '/api/v1/photo/touring/non-existent-id',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photos: [
              {
                photoPath: `users/${userId}/photos/test.jpg`,
                takenAt: '2024-06-01T10:00:00.000Z',
              },
            ],
          }),
        }
      )

      expect(res.status).toBe(404)
    })

    test('他ユーザーのtouringIdは404になる', async () => {
      const otherUser = await createTestUser()
      const otherBikeId = await getTestBikeId()
      const otherBike = await createTestUserBike(otherUser.token, {
        bikeId: otherBikeId,
      })
      const otherTouringId = await createTestTouring(
        otherUser.token,
        otherBike.myUserBikeId,
        {
          title: '他ユーザーのツーリング',
          startDate: '2024-06-01T09:00:00.000Z',
          endDate: '2024-06-01T18:00:00.000Z',
        }
      )

      const res = await app.request(
        `/api/v1/photo/touring/${otherTouringId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photos: [
              {
                photoPath: `users/${userId}/photos/test.jpg`,
                takenAt: '2024-06-01T10:00:00.000Z',
              },
            ],
          }),
        }
      )

      expect(res.status).toBe(404)
    })

    test('他ユーザーのphotoPathは400になる', async () => {
      const otherUser = await createTestUser()

      const res = await app.request(
        `/api/v1/photo/touring/${touringId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photos: [
              {
                photoPath: `users/${otherUser.userId}/photos/test.jpg`,
                takenAt: '2024-06-01T10:00:00.000Z',
              },
            ],
          }),
        }
      )

      expect(res.status).toBe(400)
    })
  })

  // -----------------------------------------------------------------------
  // GET /api/v1/photo/touring/:touringId
  // -----------------------------------------------------------------------
  describe('GET /api/v1/photo/touring/:touringId', () => {
    let token: string
    let userId: string
    let myUserBikeId: string
    let touringId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token
      userId = user.userId
      const bikeId = await getTestBikeId()
      const bike = await createTestUserBike(token, { bikeId })
      myUserBikeId = bike.myUserBikeId
      touringId = await createTestTouring(token, myUserBikeId, {
        title: 'テストツーリング',
        startDate: '2024-06-01T09:00:00.000Z',
        endDate: '2024-06-01T18:00:00.000Z',
      })
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(
        `/api/v1/photo/touring/${touringId}`,
        'GET'
      )
    })

    test('写真がない場合は空配列を返す', async () => {
      const res = await app.request(
        `/api/v1/photo/touring/${touringId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data).toEqual([])
    })

    test('写真がある場合はorderIndex昇順で返す', async () => {
      await createTestTouringPhoto({ userId, touringId, orderIndex: 0 })
      await createTestTouringPhoto({ userId, touringId, orderIndex: 1 })
      await createTestTouringPhoto({ userId, touringId, orderIndex: 2 })

      const res = await app.request(
        `/api/v1/photo/touring/${touringId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toHaveLength(3)
      expect(json.data[0].orderIndex).toBe(0)
      expect(json.data[1].orderIndex).toBe(1)
      expect(json.data[2].orderIndex).toBe(2)
    })

    test('他ユーザーのtouringIdは404になる', async () => {
      const otherUser = await createTestUser()
      const otherBikeId = await getTestBikeId()
      const otherBike = await createTestUserBike(otherUser.token, {
        bikeId: otherBikeId,
      })
      const otherTouringId = await createTestTouring(
        otherUser.token,
        otherBike.myUserBikeId,
        {
          title: '他ユーザーのツーリング',
          startDate: '2024-06-01T09:00:00.000Z',
          endDate: '2024-06-01T18:00:00.000Z',
        }
      )

      const res = await app.request(
        `/api/v1/photo/touring/${otherTouringId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      expect(res.status).toBe(404)
    })
  })

  // -----------------------------------------------------------------------
  // POST /api/v1/photo/spot/:spotId
  // -----------------------------------------------------------------------
  describe('POST /api/v1/photo/spot/:spotId', () => {
    let token: string
    let userId: string
    let myUserBikeId: string
    let touringId: string
    let spotId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token
      userId = user.userId
      const bikeId = await getTestBikeId()
      const bike = await createTestUserBike(token, { bikeId })
      myUserBikeId = bike.myUserBikeId
      touringId = await createTestTouring(token, myUserBikeId, {
        title: 'テストツーリング',
        startDate: '2024-06-01T09:00:00.000Z',
        endDate: '2024-06-01T18:00:00.000Z',
      })
      spotId = await createTestSpot(token, myUserBikeId, touringId, {
        visitedAt: '2024-06-01T11:00:00.000Z',
        type: 'SPOT',
        name: 'テストスポット',
      })
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(`/api/v1/photo/spot/${spotId}`, 'POST', {
        photos: [
          {
            photoPath: `users/${userId}/photos/test.jpg`,
            takenAt: '2024-06-01T11:00:00.000Z',
          },
        ],
      })
    })

    test('スポットに写真を登録するとDBにレコードが作成される', async () => {
      const photoPath = `users/${userId}/photos/spot-test.jpg`

      const res = await app.request(`/api/v1/photo/spot/${spotId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photos: [
            {
              photoPath,
              takenAt: '2024-06-01T11:00:00.000Z',
            },
          ],
        }),
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.data).toHaveLength(1)
      expect(json.data[0]).toMatchObject({
        photoId: expect.any(String),
        orderIndex: 0,
      })

      const dbPhoto = await prisma.tUserMyBikePhoto.findFirst({
        where: { userId, storagePath: photoPath },
      })
      expect(dbPhoto).not.toBeNull()
    })

    test('存在しないspotIdは404になる', async () => {
      const res = await app.request('/api/v1/photo/spot/non-existent-id', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photos: [
            {
              photoPath: `users/${userId}/photos/test.jpg`,
              takenAt: '2024-06-01T11:00:00.000Z',
            },
          ],
        }),
      })

      expect(res.status).toBe(404)
    })

    test('他ユーザーのspotIdは404になる', async () => {
      const otherUser = await createTestUser()
      const otherBikeId = await getTestBikeId()
      const otherBike = await createTestUserBike(otherUser.token, {
        bikeId: otherBikeId,
      })
      const otherTouringId = await createTestTouring(
        otherUser.token,
        otherBike.myUserBikeId,
        {
          title: '他ユーザーのツーリング',
          startDate: '2024-06-01T09:00:00.000Z',
          endDate: '2024-06-01T18:00:00.000Z',
        }
      )
      const otherSpotId = await createTestSpot(
        otherUser.token,
        otherBike.myUserBikeId,
        otherTouringId,
        {
          visitedAt: '2024-06-01T11:00:00.000Z',
          type: 'SPOT',
          name: '他ユーザーのスポット',
        }
      )

      const res = await app.request(
        `/api/v1/photo/spot/${otherSpotId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photos: [
              {
                photoPath: `users/${userId}/photos/test.jpg`,
                takenAt: '2024-06-01T11:00:00.000Z',
              },
            ],
          }),
        }
      )

      expect(res.status).toBe(404)
    })

    test('他ユーザーのphotoPathは400になる', async () => {
      const otherUser = await createTestUser()

      const res = await app.request(`/api/v1/photo/spot/${spotId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photos: [
            {
              photoPath: `users/${otherUser.userId}/photos/test.jpg`,
              takenAt: '2024-06-01T11:00:00.000Z',
            },
          ],
        }),
      })

      expect(res.status).toBe(400)
    })
  })

  // -----------------------------------------------------------------------
  // GET /api/v1/photo/spot/:spotId
  // -----------------------------------------------------------------------
  describe('GET /api/v1/photo/spot/:spotId', () => {
    let token: string
    let userId: string
    let myUserBikeId: string
    let touringId: string
    let spotId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token
      userId = user.userId
      const bikeId = await getTestBikeId()
      const bike = await createTestUserBike(token, { bikeId })
      myUserBikeId = bike.myUserBikeId
      touringId = await createTestTouring(token, myUserBikeId, {
        title: 'テストツーリング',
        startDate: '2024-06-01T09:00:00.000Z',
        endDate: '2024-06-01T18:00:00.000Z',
      })
      spotId = await createTestSpot(token, myUserBikeId, touringId, {
        visitedAt: '2024-06-01T11:00:00.000Z',
        type: 'SPOT',
        name: 'テストスポット',
      })
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(`/api/v1/photo/spot/${spotId}`, 'GET')
    })

    test('写真がない場合は空配列を返す', async () => {
      const res = await app.request(`/api/v1/photo/spot/${spotId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data).toEqual([])
    })

    test('写真がある場合はorderIndex昇順で返す', async () => {
      await createTestSpotPhoto({ userId, spotId, orderIndex: 0 })
      await createTestSpotPhoto({ userId, spotId, orderIndex: 1 })

      const res = await app.request(`/api/v1/photo/spot/${spotId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toHaveLength(2)
      expect(json.data[0].orderIndex).toBe(0)
      expect(json.data[1].orderIndex).toBe(1)
    })

    test('他ユーザーのspotIdは404になる', async () => {
      const otherUser = await createTestUser()
      const otherBikeId = await getTestBikeId()
      const otherBike = await createTestUserBike(otherUser.token, {
        bikeId: otherBikeId,
      })
      const otherTouringId = await createTestTouring(
        otherUser.token,
        otherBike.myUserBikeId,
        {
          title: '他ユーザーのツーリング',
          startDate: '2024-06-01T09:00:00.000Z',
          endDate: '2024-06-01T18:00:00.000Z',
        }
      )
      const otherSpotId = await createTestSpot(
        otherUser.token,
        otherBike.myUserBikeId,
        otherTouringId,
        {
          visitedAt: '2024-06-01T11:00:00.000Z',
          type: 'SPOT',
          name: '他ユーザーのスポット',
        }
      )

      const res = await app.request(
        `/api/v1/photo/spot/${otherSpotId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      expect(res.status).toBe(404)
    })
  })

  // -----------------------------------------------------------------------
  // DELETE /api/v1/photo/:photoId
  // -----------------------------------------------------------------------
  describe('DELETE /api/v1/photo/:photoId', () => {
    let token: string
    let userId: string
    let myUserBikeId: string
    let touringId: string

    beforeEach(async () => {
      const user = await createTestUser()
      token = user.token
      userId = user.userId
      const bikeId = await getTestBikeId()
      const bike = await createTestUserBike(token, { bikeId })
      myUserBikeId = bike.myUserBikeId
      touringId = await createTestTouring(token, myUserBikeId, {
        title: 'テストツーリング',
        startDate: '2024-06-01T09:00:00.000Z',
        endDate: '2024-06-01T18:00:00.000Z',
      })
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      const photoId = await createTestTouringPhoto({ userId, touringId })
      await testAuthRequired(`/api/v1/photo/${photoId}`, 'DELETE')
    })

    test('自分の写真を削除するとDBからレコードが消える', async () => {
      const photoId = await createTestTouringPhoto({ userId, touringId })

      const res = await app.request(`/api/v1/photo/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.status).toBe('success')

      const dbPhoto = await prisma.tUserMyBikePhoto.findUnique({
        where: { id: photoId },
      })
      expect(dbPhoto).toBeNull()
    })

    test('存在しない写真IDは404になる', async () => {
      const res = await app.request('/api/v1/photo/non-existent-id', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      expect(res.status).toBe(404)
    })

    test('他ユーザーの写真を削除しようとすると400になる', async () => {
      const otherUser = await createTestUser()
      const otherBikeId = await getTestBikeId()
      const otherBike = await createTestUserBike(otherUser.token, {
        bikeId: otherBikeId,
      })
      const otherTouringId = await createTestTouring(
        otherUser.token,
        otherBike.myUserBikeId,
        {
          title: '他ユーザーのツーリング',
          startDate: '2024-06-01T09:00:00.000Z',
          endDate: '2024-06-01T18:00:00.000Z',
        }
      )
      const otherPhotoId = await createTestTouringPhoto({
        userId: otherUser.userId,
        touringId: otherTouringId,
      })

      const res = await app.request(`/api/v1/photo/${otherPhotoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      expect(res.status).toBe(400)
    })
  })
})
