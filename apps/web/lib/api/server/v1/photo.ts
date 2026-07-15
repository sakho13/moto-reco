import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseBikePhotoList,
  ApiResponsePhotoDetail,
  ApiResponsePhotoUploadUrl,
  ApiResponseSpotPhotoList,
  ApiResponseTouringPhotoList,
  ApiResponseUserPhotoList,
  createMyUserBikeId,
  createPhotoId,
  createSpotId,
  createTouringId,
  createUserId,
  PhotoListQuerySchema,
  PhotoRegisterForBikeRequest,
  PhotoRegisterForBikeRequestSchema,
  PhotoRegisterForSpotRequest,
  PhotoRegisterForSpotRequestSchema,
  PhotoRegisterForTouringRequest,
  PhotoRegisterForTouringRequestSchema,
  PhotoUploadUrlRequest,
  PhotoUploadUrlRequestSchema,
  SuccessResponse,
} from '@repo/shared-types'
import {
  getFirebaseAdminStorage,
  getStorageBucketName,
} from '../../../firebase/adminStorage'
import { PhotoEntity } from '../entities/PhotoEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateJson } from '../middlewares/zodValidation'
import { PrismaPhotoRepository } from '../repositories/PrismaPhotoRepository'
import { PhotoService } from '../services/PhotoService'
import { HonoVariables } from '../types/hono'

const photo = new Hono<{ Variables: HonoVariables }>()

const SIGNED_URL_EXPIRY_MS = 15 * 60 * 1000 // 15分
// V4署名付きURLの有効期限はGCSの仕様上7日が上限
const READ_SIGNED_URL_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000
// Firebase Storage EmulatorのURL(署名付きURLでの書き込みに未対応のため専用エンドポイントを使う)
const STORAGE_EMULATOR_BASE_URL = 'http://localhost:9199'

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const toApiResponsePhotoDetail = (
  entity: PhotoEntity
): ApiResponsePhotoDetail => ({
  photoId: entity.id,
  photoUrl: entity.photoUrl,
  storagePath: entity.storagePath,
  memo: entity.memo,
  takenAt: entity.takenAt.toISOString(),
})

/**
 * photoPathがリクエストユーザーのパスに属するか検証
 * users/{userId}/photos/{filename} の形式を期待する
 */
const validatePhotoPath = (photoPath: string, userId: string): void => {
  const expectedPrefix = `users/${userId}/`
  if (!photoPath.startsWith(expectedPrefix)) {
    throw new ApiV1Error(
      'INVALID_REQUEST',
      '無効な写真パスです。自分のストレージパスのみ指定できます'
    )
  }
}

/**
 * POST /api/v1/photo/upload-url
 * 署名付きアップロードURLを生成する
 */
photo.post(
  '/upload-url',
  honoAuthMiddleware,
  zodValidateJson(PhotoUploadUrlRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const userId = userEntity.id
    const { files } = c.req.valid('json') as PhotoUploadUrlRequest

    const storage = getFirebaseAdminStorage()
    const bucketName = getStorageBucketName()
    const bucket = storage.bucket(bucketName)
    const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'

    const urls: ApiResponsePhotoUploadUrl = []

    for (const fileItem of files) {
      const ext = CONTENT_TYPE_TO_EXT[fileItem.contentType] ?? 'jpg'
      const filename = `${crypto.randomUUID()}.${ext}`
      const photoPath = `users/${userId}/photos/${filename}`

      if (useEmulator) {
        // Storage Emulatorは署名付きURLでの書き込み(PUT)に未対応のため、
        // エミュレータのJSON API(単純アップロード)へ直接POSTさせる
        const uploadUrl = `${STORAGE_EMULATOR_BASE_URL}/upload/storage/v1/b/${encodeURIComponent(bucketName)}/o?uploadType=media&name=${encodeURIComponent(photoPath)}`
        urls.push({
          signedUploadUrl: uploadUrl,
          photoPath,
          uploadMethod: 'POST',
        })
        continue
      }

      const file = bucket.file(photoPath)
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + SIGNED_URL_EXPIRY_MS,
        contentType: fileItem.contentType,
      })

      urls.push({ signedUploadUrl: signedUrl, photoPath, uploadMethod: 'PUT' })
    }

    return c.json<SuccessResponse<ApiResponsePhotoUploadUrl>>({
      status: 'success',
      data: urls,
      message: '署名付きアップロードURL生成成功',
    })
  }
)

/**
 * POST /api/v1/photo/touring/:touringId
 * ツーリングに写真を追加する
 */
photo.post(
  '/touring/:touringId',
  honoAuthMiddleware,
  zodValidateJson(PhotoRegisterForTouringRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const userId = userEntity.id
    const touringId = c.req.param('touringId')
    const { photos } = c.req.valid('json') as PhotoRegisterForTouringRequest

    // 所有権検証: touringがこのユーザーのものか
    const touring = await prisma.tUserMyBikeTouring.findFirst({
      where: {
        id: touringId,
        userMyBike: { userId },
      },
    })

    if (!touring) {
      throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
    }

    // photoPathが自分のパスに属するか検証
    for (const p of photos) {
      validatePhotoPath(p.photoPath, userId)
    }

    // Firebase Storage から photoUrl を取得
    const storage = getFirebaseAdminStorage()
    const bucketName = getStorageBucketName()
    const bucket = storage.bucket(bucketName)

    const photosWithUrls = await Promise.all(
      photos.map(async (p) => {
        const file = bucket.file(p.photoPath)
        const [url] = await file.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + READ_SIGNED_URL_EXPIRY_MS,
        })
        return { ...p, photoUrl: url }
      })
    )

    const photoRepo = new PrismaPhotoRepository(prisma)
    const service = new PhotoService(photoRepo)

    const created = await service.registerPhotosForTouring({
      userId: createUserId(userId),
      touringId: createTouringId(touringId),
      photos: photosWithUrls.map((p) => ({
        storagePath: p.photoPath,
        photoUrl: p.photoUrl,
        memo: p.memo,
        takenAt: p.takenAt,
      })),
    })

    return c.json<SuccessResponse<ApiResponseTouringPhotoList>>(
      {
        status: 'success',
        data: created.map(toApiResponsePhotoDetail),
        message: 'ツーリング写真登録成功',
      },
      201
    )
  }
)

/**
 * GET /api/v1/photo/touring/:touringId
 * ツーリングの写真一覧を取得する
 */
photo.get('/touring/:touringId', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!
  const userId = userEntity.id
  const touringId = c.req.param('touringId')

  const touring = await prisma.tUserMyBikeTouring.findFirst({
    where: {
      id: touringId,
      userMyBike: { userId },
    },
  })

  if (!touring) {
    throw new ApiV1Error('NOT_FOUND', '指定されたツーリングが見つかりません')
  }

  const photoRepo = new PrismaPhotoRepository(prisma)
  const service = new PhotoService(photoRepo)
  const photos = await service.getPhotosByTouringId(createTouringId(touringId))

  return c.json<SuccessResponse<ApiResponseTouringPhotoList>>({
    status: 'success',
    data: photos.map(toApiResponsePhotoDetail),
    message: 'ツーリング写真一覧取得成功',
  })
})

/**
 * POST /api/v1/photo/spot/:spotId
 * スポットに写真を追加する
 */
photo.post(
  '/spot/:spotId',
  honoAuthMiddleware,
  zodValidateJson(PhotoRegisterForSpotRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const userId = userEntity.id
    const spotId = c.req.param('spotId')
    const { photos } = c.req.valid('json') as PhotoRegisterForSpotRequest

    // 所有権検証: spotがこのユーザーのものか
    const spot = await prisma.tUserMyBikeTouringSpot.findFirst({
      where: {
        id: spotId,
        touring: {
          userMyBike: { userId },
        },
      },
    })

    if (!spot) {
      throw new ApiV1Error('NOT_FOUND', '指定されたスポットが見つかりません')
    }

    for (const p of photos) {
      validatePhotoPath(p.photoPath, userId)
    }

    const storage = getFirebaseAdminStorage()
    const bucketName = getStorageBucketName()
    const bucket = storage.bucket(bucketName)

    const photosWithUrls = await Promise.all(
      photos.map(async (p) => {
        const file = bucket.file(p.photoPath)
        const [url] = await file.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + READ_SIGNED_URL_EXPIRY_MS,
        })
        return { ...p, photoUrl: url }
      })
    )

    const photoRepo = new PrismaPhotoRepository(prisma)
    const service = new PhotoService(photoRepo)

    const created = await service.registerPhotosForSpot({
      userId: createUserId(userId),
      spotId: createSpotId(spotId),
      photos: photosWithUrls.map((p) => ({
        storagePath: p.photoPath,
        photoUrl: p.photoUrl,
        memo: p.memo,
        takenAt: p.takenAt,
      })),
    })

    return c.json<SuccessResponse<ApiResponseSpotPhotoList>>(
      {
        status: 'success',
        data: created.map(toApiResponsePhotoDetail),
        message: 'スポット写真登録成功',
      },
      201
    )
  }
)

/**
 * GET /api/v1/photo/spot/:spotId
 * スポットの写真一覧を取得する
 */
photo.get('/spot/:spotId', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!
  const userId = userEntity.id
  const spotId = c.req.param('spotId')

  const spot = await prisma.tUserMyBikeTouringSpot.findFirst({
    where: {
      id: spotId,
      touring: {
        userMyBike: { userId },
      },
    },
  })

  if (!spot) {
    throw new ApiV1Error('NOT_FOUND', '指定されたスポットが見つかりません')
  }

  const photoRepo = new PrismaPhotoRepository(prisma)
  const service = new PhotoService(photoRepo)
  const photos = await service.getPhotosBySpotId(createSpotId(spotId))

  return c.json<SuccessResponse<ApiResponseSpotPhotoList>>({
    status: 'success',
    data: photos.map(toApiResponsePhotoDetail),
    message: 'スポット写真一覧取得成功',
  })
})

/**
 * POST /api/v1/photo/bike/:myUserBikeId
 * バイク本体に写真を追加する（ツーリング/スポットを介さない日常の1枚）
 */
photo.post(
  '/bike/:myUserBikeId',
  honoAuthMiddleware,
  zodValidateJson(PhotoRegisterForBikeRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const userId = userEntity.id
    const myUserBikeId = c.req.param('myUserBikeId')
    const { photos } = c.req.valid('json') as PhotoRegisterForBikeRequest

    // 所有権検証: バイクがこのユーザーのものか
    const myBike = await prisma.tUserMyBike.findFirst({
      where: { id: myUserBikeId, userId },
    })

    if (!myBike) {
      throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
    }

    for (const p of photos) {
      validatePhotoPath(p.photoPath, userId)
    }

    const storage = getFirebaseAdminStorage()
    const bucketName = getStorageBucketName()
    const bucket = storage.bucket(bucketName)

    const photosWithUrls = await Promise.all(
      photos.map(async (p) => {
        const file = bucket.file(p.photoPath)
        const [url] = await file.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + READ_SIGNED_URL_EXPIRY_MS,
        })
        return { ...p, photoUrl: url }
      })
    )

    const photoRepo = new PrismaPhotoRepository(prisma)
    const service = new PhotoService(photoRepo)

    const created = await service.registerPhotosForBike({
      userId: createUserId(userId),
      myUserBikeId: createMyUserBikeId(myUserBikeId),
      photos: photosWithUrls.map((p) => ({
        storagePath: p.photoPath,
        photoUrl: p.photoUrl,
        memo: p.memo,
        takenAt: p.takenAt,
      })),
    })

    return c.json<SuccessResponse<ApiResponseBikePhotoList>>(
      {
        status: 'success',
        data: created.map(toApiResponsePhotoDetail),
        message: 'バイク写真登録成功',
      },
      201
    )
  }
)

/**
 * GET /api/v1/photo/bike/:myUserBikeId
 * バイク本体に直接紐づく写真一覧を取得する
 */
photo.get('/bike/:myUserBikeId', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!
  const userId = userEntity.id
  const myUserBikeId = c.req.param('myUserBikeId')

  const myBike = await prisma.tUserMyBike.findFirst({
    where: { id: myUserBikeId, userId },
  })

  if (!myBike) {
    throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
  }

  const photoRepo = new PrismaPhotoRepository(prisma)
  const service = new PhotoService(photoRepo)
  const photos = await service.getPhotosByMyBikeId(
    createMyUserBikeId(myUserBikeId)
  )

  return c.json<SuccessResponse<ApiResponseBikePhotoList>>({
    status: 'success',
    data: photos.map(toApiResponsePhotoDetail),
    message: 'バイク写真一覧取得成功',
  })
})

/**
 * GET /api/v1/photo
 * ユーザーの全写真を横断して取得する（マイフォト・ギャラリー、ページネーション対応）
 * ツーリング/スポット/バイクいずれの紐づけかは attachedTo で返す
 */
photo.get('/', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!
  const userId = userEntity.id

  const queryResult = PhotoListQuerySchema.safeParse(c.req.query())
  if (!queryResult.success) {
    return c.json(
      {
        status: 'error',
        errorCode: 'VALIDATION_ERROR',
        message: 'クエリパラメータが不正です',
      },
      400
    )
  }
  const page = queryResult.data.page ?? 1
  const pageSize = queryResult.data['per-size'] ?? 30

  const photoRepo = new PrismaPhotoRepository(prisma)
  const service = new PhotoService(photoRepo)
  const photos = await service.getPhotosByUserId(createUserId(userId), {
    page,
    pageSize,
  })

  return c.json<SuccessResponse<ApiResponseUserPhotoList>>({
    status: 'success',
    data: photos.map((entity) => ({
      ...toApiResponsePhotoDetail(entity),
      attachments: entity.attachments.map((attachment) =>
        attachment.type === 'TOURING'
          ? { type: 'TOURING' as const, touringId: attachment.touringId }
          : attachment.type === 'SPOT'
            ? { type: 'SPOT' as const, spotId: attachment.spotId }
            : { type: 'BIKE' as const, myUserBikeId: attachment.myUserBikeId }
      ),
    })),
    message: 'マイフォト一覧取得成功',
  })
})

/**
 * DELETE /api/v1/photo/:photoId
 * 写真を削除する（Storage上のファイルも削除）
 */
photo.delete('/:photoId', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!
  const userId = userEntity.id
  const photoId = c.req.param('photoId')

  const photoRepo = new PrismaPhotoRepository(prisma)
  const service = new PhotoService(photoRepo)

  const storagePath = await service.deletePhoto({
    photoId: createPhotoId(photoId),
    userId: createUserId(userId),
  })

  // Firebase Storage からファイルを削除
  const storage = getFirebaseAdminStorage()
  const bucketName = getStorageBucketName()
  const bucket = storage.bucket(bucketName)
  await bucket.file(storagePath).delete({ ignoreNotFound: true })

  return c.json<SuccessResponse<undefined>>({
    status: 'success',
    data: undefined,
    message: '写真削除成功',
  })
})

export default photo
