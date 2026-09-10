import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { prisma } from '@repo/database'
import { createTestUser, testAuthRequired } from '../../helpers/authHelper'
import { getTestBikeId, createTestUserBike } from '../../helpers/bikeHelper'
import { createAdminUser } from '../../helpers/notificationHelper'
import {
  createTestTouringPhoto,
  createTestSpotPhoto,
} from '../../helpers/photoHelper'
import { createTestTouring, createTestSpot } from '../../helpers/touringHelper'
import { app } from '@/lib/api/server/app'

// bucket().file() はエンドポイントごとに新しいオブジェクトを返すが、
// download/save/resize の呼び出し検証のためモック関数自体はテストファイル内で
// 共有インスタンスとして保持する。vi.mock() はファイル先頭へ巻き上げられるため、
// ファクトリ内から参照する変数は vi.hoisted() で明示的に巻き上げる必要がある。
const { mockFileDownload, mockFileSave, mockResize } = vi.hoisted(() => ({
  mockFileDownload: vi.fn().mockResolvedValue([Buffer.from('fake-image-data')]),
  mockFileSave: vi.fn().mockResolvedValue(undefined),
  mockResize: vi.fn().mockResolvedValue(Buffer.from('resized-fake-image-data')),
}))

vi.mock('@repo/firebase-auth-server', async (importOriginal) => ({
  ...(await importOriginal()),
  getFirebaseAdminStorage: () => ({
    bucket: () => ({
      file: () => ({
        getSignedUrl: vi
          .fn()
          .mockResolvedValue(['https://storage.example.com/signed-test.jpg']),
        delete: vi.fn().mockResolvedValue([{}]),
        download: mockFileDownload,
        save: mockFileSave,
      }),
    }),
  }),
  getStorageBucketName: () => 'test-bucket',
}))

// sharpによる実画像加工（Buffer.from('fake-image-data')は有効な画像バイナリではなく
// sharpが例外を投げる）を避けるため、リサイズ処理自体はモック化する。
// 「リサイズ処理が呼ばれること」「レスポンス形式に影響がないこと」の検証が目的で、
// 実際の画像加工結果の正しさはImageResizeService自体の単体テストで担保する。
vi.mock('@/lib/api/server/services/ImageResizeService', () => ({
  ImageResizeService: vi.fn().mockImplementation(() => ({
    resize: mockResize,
  })),
}))

describe('Photo API Endpoints', () => {
  // 各テストの afterEach で vi.restoreAllMocks() を呼ぶため、
  // vi.fn() ベースの共有モック（元実装を持たない）は呼び出しごとに
  // undefined 化してしまう。次のテストの前に必ずデフォルト実装へ戻す。
  beforeEach(() => {
    mockFileDownload.mockClear()
    mockFileDownload.mockResolvedValue([Buffer.from('fake-image-data')])
    mockFileSave.mockClear()
    mockFileSave.mockResolvedValue(undefined)
    mockResize.mockClear()
    mockResize.mockResolvedValue(Buffer.from('resized-fake-image-data'))
  })

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
      await createAdminUser(user.token, user.userId)
      token = user.token
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired('/api/v1/photo/upload-url', 'POST', {
        files: [
          { contentType: 'image/jpeg', fileName: 'a.jpg', fileSize: 1000 },
        ],
      })
    })

    test('files=2件で2件の署名付きURLを返す', async () => {
      const res = await app.request('/api/v1/photo/upload-url', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: [
            { contentType: 'image/jpeg', fileName: 'a.jpg', fileSize: 1000 },
            { contentType: 'image/png', fileName: 'b.png', fileSize: 2000 },
          ],
        }),
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
        body: JSON.stringify({
          files: [
            { contentType: 'image/gif', fileName: 'a.gif', fileSize: 1000 },
          ],
        }),
      })

      expect(res.status).toBe(400)
    })

    test('filesが空配列はバリデーションエラーになる', async () => {
      const res = await app.request('/api/v1/photo/upload-url', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: [] }),
      })

      expect(res.status).toBe(400)
    })

    test('files=11件（上限超過）はバリデーションエラーになる', async () => {
      const res = await app.request('/api/v1/photo/upload-url', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: Array.from({ length: 11 }, (_, i) => ({
            contentType: 'image/jpeg',
            fileName: `file${i}.jpg`,
            fileSize: 1000,
          })),
        }),
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
      await createAdminUser(user.token, user.userId)
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
      await testAuthRequired(`/api/v1/photo/touring/${touringId}`, 'POST', {
        photos: [
          {
            photoPath: `users/${userId}/photos/test.jpg`,
            takenAt: '2024-06-01T10:00:00.000Z',
          },
        ],
      })
    })

    test('1枚の写真を登録するとDBにレコードが作成される', async () => {
      const photoPath = `users/${userId}/photos/test.jpg`

      const res = await app.request(`/api/v1/photo/touring/${touringId}`, {
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
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.data).toHaveLength(1)
      expect(json.data[0]).toMatchObject({
        photoId: expect.any(String),
        photoUrl: expect.any(String),
      })

      const dbPhoto = await prisma.tUserPhoto.findFirst({
        where: { userId, storagePath: photoPath },
      })
      expect(dbPhoto).not.toBeNull()
    })

    test('写真登録時にStorageからダウンロードして加工後のファイルを同一パスへ書き戻す(#560)', async () => {
      const photoPath = `users/${userId}/photos/resize-test.jpg`

      const res = await app.request(`/api/v1/photo/touring/${touringId}`, {
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
      })

      expect(res.status).toBe(201)
      // Storageからのダウンロード・リサイズ・書き戻しが行われたことを検証
      expect(mockFileDownload).toHaveBeenCalledTimes(1)
      expect(mockResize).toHaveBeenCalledWith(
        Buffer.from('fake-image-data'),
        'image/jpeg'
      )
      expect(mockFileSave).toHaveBeenCalledWith(
        Buffer.from('resized-fake-image-data'),
        { contentType: 'image/jpeg', resumable: false }
      )

      // リサイズ処理が追加されてもレスポンス形式に変化がないことを確認
      const json = await res.json()
      expect(json.data[0]).toMatchObject({
        photoId: expect.any(String),
        photoUrl: expect.any(String),
        storagePath: photoPath,
      })
    })

    test('複数枚登録すると全件作成される', async () => {
      const res = await app.request(`/api/v1/photo/touring/${touringId}`, {
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
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.data).toHaveLength(3)
      const photoIds = json.data.map((p: { photoId: string }) => p.photoId)
      expect(new Set(photoIds).size).toBe(3)
    })

    test('存在しないtouringIdは404になる', async () => {
      const res = await app.request('/api/v1/photo/touring/non-existent-id', {
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
      })

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

      const res = await app.request(`/api/v1/photo/touring/${otherTouringId}`, {
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
      })

      expect(res.status).toBe(404)
    })

    test('他ユーザーのphotoPathは400になる', async () => {
      const otherUser = await createTestUser()

      const res = await app.request(`/api/v1/photo/touring/${touringId}`, {
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
      })

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
      await createAdminUser(user.token, user.userId)
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
      await testAuthRequired(`/api/v1/photo/touring/${touringId}`, 'GET')
    })

    test('写真がない場合は空配列を返す', async () => {
      const res = await app.request(`/api/v1/photo/touring/${touringId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data).toEqual([])
    })

    test('写真がある場合は撮影日時の昇順で返す', async () => {
      const photoId1 = await createTestTouringPhoto({
        userId,
        touringId,
        takenAt: new Date('2024-06-01T10:00:00.000Z'),
      })
      const photoId2 = await createTestTouringPhoto({
        userId,
        touringId,
        takenAt: new Date('2024-06-01T11:00:00.000Z'),
      })
      const photoId3 = await createTestTouringPhoto({
        userId,
        touringId,
        takenAt: new Date('2024-06-01T12:00:00.000Z'),
      })

      const res = await app.request(`/api/v1/photo/touring/${touringId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toHaveLength(3)
      expect(json.data.map((p: { photoId: string }) => p.photoId)).toEqual([
        photoId1,
        photoId2,
        photoId3,
      ])
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

      const res = await app.request(`/api/v1/photo/touring/${otherTouringId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      expect(res.status).toBe(404)
    })

    test('DBに保存された古いphotoUrlではなく都度発行した署名付きURLを返す(#514)', async () => {
      // DBに保存されたphotoUrlは登録時点の署名付きURLで、期限切れになりうる。
      // 取得のたびに再発行する必要があるため、DB上の値と異なることを確認する。
      const photoId = await createTestTouringPhoto({ userId, touringId })

      const res = await app.request(`/api/v1/photo/touring/${touringId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()
      expect(res.status).toBe(200)
      const photo = json.data.find(
        (p: { photoId: string }) => p.photoId === photoId
      )
      expect(photo.photoUrl).toBe('https://storage.example.com/signed-test.jpg')
      expect(photo.photoUrl).not.toBe('https://storage.example.com/test.jpg')
    })
  })

  // -----------------------------------------------------------------------
  // POST /api/v1/photo/touring/:touringId/spot/:spotId
  // -----------------------------------------------------------------------
  describe('POST /api/v1/photo/touring/:touringId/spot/:spotId', () => {
    let token: string
    let userId: string
    let myUserBikeId: string
    let touringId: string
    let spotId: string

    beforeEach(async () => {
      const user = await createTestUser()
      await createAdminUser(user.token, user.userId)
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
      await testAuthRequired(
        `/api/v1/photo/touring/${touringId}/spot/${spotId}`,
        'POST',
        {
          photos: [
            {
              photoPath: `users/${userId}/photos/test.jpg`,
              takenAt: '2024-06-01T11:00:00.000Z',
            },
          ],
        }
      )
    })

    test('スポットに写真を登録するとDBにレコードが作成される', async () => {
      const photoPath = `users/${userId}/photos/spot-test.jpg`

      const res = await app.request(
        `/api/v1/photo/touring/${touringId}/spot/${spotId}`,
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
                takenAt: '2024-06-01T11:00:00.000Z',
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
      })

      const dbPhoto = await prisma.tUserPhoto.findFirst({
        where: { userId, storagePath: photoPath },
      })
      expect(dbPhoto).not.toBeNull()
    })

    test('写真登録時にStorageからダウンロードして加工後のファイルを同一パスへ書き戻す(#560)', async () => {
      const photoPath = `users/${userId}/photos/resize-spot-test.png`

      const res = await app.request(
        `/api/v1/photo/touring/${touringId}/spot/${spotId}`,
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
                takenAt: '2024-06-01T11:00:00.000Z',
              },
            ],
          }),
        }
      )

      expect(res.status).toBe(201)
      expect(mockFileDownload).toHaveBeenCalledTimes(1)
      // 拡張子(.png)からcontentTypeが推測されていることを検証
      expect(mockResize).toHaveBeenCalledWith(
        Buffer.from('fake-image-data'),
        'image/png'
      )
      expect(mockFileSave).toHaveBeenCalledWith(
        Buffer.from('resized-fake-image-data'),
        { contentType: 'image/png', resumable: false }
      )

      const json = await res.json()
      expect(json.data[0]).toMatchObject({
        photoId: expect.any(String),
        storagePath: photoPath,
      })
    })

    test('存在しないtouringIdは404になる', async () => {
      const res = await app.request(
        `/api/v1/photo/touring/non-existent-id/spot/${spotId}`,
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

    test('存在しないspotIdは404になる', async () => {
      const res = await app.request(
        `/api/v1/photo/touring/${touringId}/spot/non-existent-id`,
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

    test('他のtouringIdに属するspotIdは404になる', async () => {
      const otherTouringId = await createTestTouring(token, myUserBikeId, {
        title: '別のテストツーリング',
        startDate: '2024-06-02T09:00:00.000Z',
        endDate: '2024-06-02T18:00:00.000Z',
      })

      const res = await app.request(
        `/api/v1/photo/touring/${otherTouringId}/spot/${spotId}`,
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

    test('他ユーザーのtouringId・spotIdは404になる', async () => {
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
        `/api/v1/photo/touring/${otherTouringId}/spot/${otherSpotId}`,
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

      const res = await app.request(
        `/api/v1/photo/touring/${touringId}/spot/${spotId}`,
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
                takenAt: '2024-06-01T11:00:00.000Z',
              },
            ],
          }),
        }
      )

      expect(res.status).toBe(400)
    })
  })

  // -----------------------------------------------------------------------
  // GET /api/v1/photo/touring/:touringId/spot/:spotId
  // -----------------------------------------------------------------------
  describe('GET /api/v1/photo/touring/:touringId/spot/:spotId', () => {
    let token: string
    let userId: string
    let myUserBikeId: string
    let touringId: string
    let spotId: string

    beforeEach(async () => {
      const user = await createTestUser()
      await createAdminUser(user.token, user.userId)
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
      await testAuthRequired(
        `/api/v1/photo/touring/${touringId}/spot/${spotId}`,
        'GET'
      )
    })

    test('写真がない場合は空配列を返す', async () => {
      const res = await app.request(
        `/api/v1/photo/touring/${touringId}/spot/${spotId}`,
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

    test('写真がある場合は撮影日時の昇順で返す', async () => {
      const photoId1 = await createTestSpotPhoto({
        userId,
        spotId,
        takenAt: new Date('2024-06-01T11:00:00.000Z'),
      })
      const photoId2 = await createTestSpotPhoto({
        userId,
        spotId,
        takenAt: new Date('2024-06-01T12:00:00.000Z'),
      })

      const res = await app.request(
        `/api/v1/photo/touring/${touringId}/spot/${spotId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.data).toHaveLength(2)
      expect(json.data.map((p: { photoId: string }) => p.photoId)).toEqual([
        photoId1,
        photoId2,
      ])
    })

    test('他のtouringIdに属するspotIdは404になる', async () => {
      const otherTouringId = await createTestTouring(token, myUserBikeId, {
        title: '別のテストツーリング',
        startDate: '2024-06-02T09:00:00.000Z',
        endDate: '2024-06-02T18:00:00.000Z',
      })

      const res = await app.request(
        `/api/v1/photo/touring/${otherTouringId}/spot/${spotId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      expect(res.status).toBe(404)
    })

    test('他ユーザーのtouringId・spotIdは404になる', async () => {
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
        `/api/v1/photo/touring/${otherTouringId}/spot/${otherSpotId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      expect(res.status).toBe(404)
    })

    test('DBに保存された古いphotoUrlではなく都度発行した署名付きURLを返す(#514)', async () => {
      const photoId = await createTestSpotPhoto({ userId, spotId })

      const res = await app.request(
        `/api/v1/photo/touring/${touringId}/spot/${spotId}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      const photo = json.data.find(
        (p: { photoId: string }) => p.photoId === photoId
      )
      expect(photo.photoUrl).toBe('https://storage.example.com/signed-test.jpg')
      expect(photo.photoUrl).not.toBe('https://storage.example.com/test.jpg')
    })
  })

  // -----------------------------------------------------------------------
  // POST /api/v1/photo/bike/:myUserBikeId
  // -----------------------------------------------------------------------
  describe('POST /api/v1/photo/bike/:myUserBikeId', () => {
    let token: string
    let userId: string
    let myUserBikeId: string

    beforeEach(async () => {
      const user = await createTestUser()
      await createAdminUser(user.token, user.userId)
      token = user.token
      userId = user.userId
      const bikeId = await getTestBikeId()
      const bike = await createTestUserBike(token, { bikeId })
      myUserBikeId = bike.myUserBikeId
    })

    test('Authorizationヘッダーが未指定の場合にエラーとなる', async () => {
      await testAuthRequired(`/api/v1/photo/bike/${myUserBikeId}`, 'POST', {
        photos: [
          {
            photoPath: `users/${userId}/photos/test.jpg`,
            takenAt: '2024-06-01T10:00:00.000Z',
          },
        ],
      })
    })

    test('1枚の写真を登録するとDBにレコードが作成される', async () => {
      const photoPath = `users/${userId}/photos/bike-test.jpg`

      const res = await app.request(`/api/v1/photo/bike/${myUserBikeId}`, {
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
      })

      const json = await res.json()
      expect(res.status).toBe(201)
      expect(json.status).toBe('success')
      expect(json.data).toHaveLength(1)
      expect(json.data[0]).toMatchObject({
        photoId: expect.any(String),
        photoUrl: expect.any(String),
      })

      const dbPhoto = await prisma.tUserPhoto.findFirst({
        where: { userId, storagePath: photoPath },
      })
      expect(dbPhoto).not.toBeNull()
    })

    test('写真登録時にStorageからダウンロードして加工後のファイルを同一パスへ書き戻す(#560)', async () => {
      const photoPath = `users/${userId}/photos/resize-bike-test.webp`

      const res = await app.request(`/api/v1/photo/bike/${myUserBikeId}`, {
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
      })

      expect(res.status).toBe(201)
      expect(mockFileDownload).toHaveBeenCalledTimes(1)
      // 拡張子(.webp)からcontentTypeが推測されていることを検証
      expect(mockResize).toHaveBeenCalledWith(
        Buffer.from('fake-image-data'),
        'image/webp'
      )
      expect(mockFileSave).toHaveBeenCalledWith(
        Buffer.from('resized-fake-image-data'),
        { contentType: 'image/webp', resumable: false }
      )

      const json = await res.json()
      expect(json.data[0]).toMatchObject({
        photoId: expect.any(String),
        photoUrl: expect.any(String),
        storagePath: photoPath,
      })
    })

    test('他ユーザーのphotoPathは400になる', async () => {
      const otherUser = await createTestUser()

      const res = await app.request(`/api/v1/photo/bike/${myUserBikeId}`, {
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
      })

      expect(res.status).toBe(400)
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
      await createAdminUser(user.token, user.userId)
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

      const dbPhoto = await prisma.tUserPhoto.findUnique({
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
