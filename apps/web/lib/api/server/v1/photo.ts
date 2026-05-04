import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponsePhotoDetail,
  ApiResponsePhotoUploadUrl,
  ApiResponseSpotPhotoList,
  ApiResponseTouringPhotoList,
  createPhotoId,
  createSpotId,
  createTouringId,
  createUserId,
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
import { SpotPhotoEntity, TouringPhotoEntity } from '../entities/PhotoEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateJson } from '../middlewares/zodValidation'
import { PrismaPhotoRepository } from '../repositories/PrismaPhotoRepository'
import { PhotoService } from '../services/PhotoService'
import { HonoVariables } from '../types/hono'

const photo = new Hono<{ Variables: HonoVariables }>()

const SIGNED_URL_EXPIRY_MS = 15 * 60 * 1000 // 15分

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const toApiResponsePhotoDetail = (
  entity: TouringPhotoEntity | SpotPhotoEntity,
  orderIndex: number
): ApiResponsePhotoDetail => ({
  photoId: entity.id,
  photoUrl: entity.photoUrl,
  storagePath: entity.storagePath,
  memo: entity.memo,
  takenAt: entity.takenAt.toISOString(),
  orderIndex,
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
    const { userId } = c.var.user!
    const { files } = c.req.valid('json') as PhotoUploadUrlRequest

    const storage = getFirebaseAdminStorage()
    const bucketName = getStorageBucketName()
    const bucket = storage.bucket(bucketName)

    const urls: ApiResponsePhotoUploadUrl = []

    for (const fileItem of files) {
      const ext = CONTENT_TYPE_TO_EXT[fileItem.contentType] ?? 'jpg'
      const filename = `${crypto.randomUUID()}.${ext}`
      const photoPath = `users/${userId}/photos/${filename}`
      const file = bucket.file(photoPath)

      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + SIGNED_URL_EXPIRY_MS,
        contentType: fileItem.contentType,
      })

      urls.push({ signedUploadUrl: signedUrl, photoPath })
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
    const { userId } = c.var.user!
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
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1年
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
        data: created.map((entity) =>
          toApiResponsePhotoDetail(entity, entity.orderIndex)
        ),
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
  const { userId } = c.var.user!
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
    data: photos.map((entity) =>
      toApiResponsePhotoDetail(entity, entity.orderIndex)
    ),
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
    const { userId } = c.var.user!
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
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
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
        data: created.map((entity) =>
          toApiResponsePhotoDetail(entity, entity.orderIndex)
        ),
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
  const { userId } = c.var.user!
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
    data: photos.map((entity) =>
      toApiResponsePhotoDetail(entity, entity.orderIndex)
    ),
    message: 'スポット写真一覧取得成功',
  })
})

/**
 * DELETE /api/v1/photo/:photoId
 * 写真を削除する（Storage上のファイルも削除）
 */
photo.delete('/:photoId', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!
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
