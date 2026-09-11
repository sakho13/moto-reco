import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  getFirebaseAdminStorage,
  getStorageBucketName,
} from '@repo/firebase-auth-server'
import { PhotoEntity, ApiV1Error } from '@repo/shared-domain'
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
  PHOTO_MAX_FILE_SIZE_BYTES,
  PhotoListQuerySchema,
  PhotoRegisterForBikeRequestSchema,
  PhotoRegisterForSpotRequestSchema,
  PhotoRegisterForTouringRequestSchema,
  PhotoUploadUrlRequestSchema,
  SuccessResponse,
} from '@repo/shared-types'
import type { AllowedPhotoContentType } from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'
import { honoAdminMiddleware } from '../middlewares/honoAdmin'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateJson } from '../middlewares/zodValidation'
import { PrismaMyUserBikeRepository } from '../repositories/PrismaMyUserBikeRepository'
import { PrismaPhotoRepository } from '../repositories/PrismaPhotoRepository'
import { PrismaSpotRepository } from '../repositories/PrismaSpotRepository'
import { PrismaTouringRepository } from '../repositories/PrismaTouringRepository'
import { ImageResizeService } from '../services/ImageResizeService'
import { PhotoService } from '../services/PhotoService'
import { HonoVariables } from '../types/hono'

const createPhotoService = (): PhotoService =>
  new PhotoService(
    new PrismaPhotoRepository(prisma),
    new PrismaTouringRepository(prisma),
    new PrismaSpotRepository(prisma),
    new PrismaMyUserBikeRepository(prisma)
  )

const photo = new Hono<{ Variables: HonoVariables }>()

const SIGNED_URL_EXPIRY_MS = 15 * 60 * 1000 // 15分
// V4署名付きURLの有効期限はGCSの仕様上7日が上限。
// 表示のたびに再発行はするが、発行したURL自体の有効期限は
// クライアント側のキャッシュ保持期間を考慮しこの上限のまま維持する
const READ_SIGNED_URL_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000
// Firebase Storage EmulatorのURL(署名付きURLでの書き込みに未対応のため専用エンドポイントを使う)
const STORAGE_EMULATOR_BASE_URL = 'http://localhost:9199'

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// CONTENT_TYPE_TO_EXTの逆引きマップ（拡張子からcontentTypeを推測する用）
// 未知の拡張子の場合のフォールバックはimage/jpegとする
const EXT_TO_CONTENT_TYPE: Record<string, AllowedPhotoContentType> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const DEFAULT_PHOTO_CONTENT_TYPE: AllowedPhotoContentType = 'image/jpeg'

const imageResizeService = new ImageResizeService()

const getBucket = () => {
  const storage = getFirebaseAdminStorage()
  const bucketName = getStorageBucketName()
  return storage.bucket(bucketName)
}

/**
 * storagePathから読み取り用の署名付きURLを都度発行する。
 * DBにURLを保存して使い回すと有効期限切れ(GCSのExpiredToken)で
 * 取得できなくなるため、表示のたびに必ず再生成すること。
 */
const generateReadSignedUrl = async (
  bucket: ReturnType<typeof getBucket>,
  storagePath: string
): Promise<string> => {
  const file = bucket.file(storagePath)
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: getCurrentDate().getTime() + READ_SIGNED_URL_EXPIRY_MS,
  })
  return url
}

const toApiResponsePhotoDetail = (
  entity: PhotoEntity,
  photoUrl: string
): ApiResponsePhotoDetail => ({
  photoId: entity.id,
  photoUrl,
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
 * photoPathの拡張子からcontentTypeを推測する
 *
 * @remarks
 * リクエストスキーマにcontentTypeは含まれず、またStorage Emulator環境では
 * 単純アップロード方式のためStorage上のメタデータも確実ではない。
 * `/upload-url` でサーバー自身がCONTENT_TYPE_TO_EXTを使い発行した拡張子付き
 * パスであるため、拡張子からの逆引きは信頼できる。
 * 未知の拡張子の場合はimage/jpegへフォールバックする。
 *
 * @param photoPath - Storage上の写真パス
 * @returns 推測したcontentType
 */
const inferContentTypeFromPath = (
  photoPath: string
): AllowedPhotoContentType => {
  const ext = photoPath.split('.').pop()?.toLowerCase() ?? ''
  return EXT_TO_CONTENT_TYPE[ext] ?? DEFAULT_PHOTO_CONTENT_TYPE
}

// 一度に加工処理を走らせる写真の最大数。写真登録は1リクエストあたり最大
// PHOTO_MAX_COUNT件だが、巨大な画像を同時に複数枚Buffer展開するとメモリを
// 圧迫するため、実際の並列実行数はこの値で抑える
const RESIZE_CONCURRENCY = 3

/**
 * Storage上の1枚の写真をダウンロードし、ImageResizeServiceでリサイズ・圧縮した上で
 * 同一パスへ書き戻す
 *
 * @remarks
 * ダウンロード前に実体のファイルサイズをメタデータで確認し、上限を超える場合は
 * ダウンロード自体を行わずにエラーとする（署名付きURL発行時の申告サイズを
 * 信用せず、Storage上の実オブジェクトを直接検証する）。
 *
 * @param bucket - 対象のStorageバケット
 * @param photoPath - リサイズ・書き戻し対象の写真パス
 * @throws {ApiV1Error} ファイルサイズが上限を超える場合
 */
const resizeAndReplaceStoredPhoto = async (
  bucket: ReturnType<typeof getBucket>,
  photoPath: string
): Promise<void> => {
  const file = bucket.file(photoPath)

  const [metadata] = await file.getMetadata()
  const size = Number(metadata.size ?? 0)
  if (size > PHOTO_MAX_FILE_SIZE_BYTES) {
    throw new ApiV1Error(
      'INVALID_REQUEST',
      `写真のファイルサイズが上限(${PHOTO_MAX_FILE_SIZE_BYTES}バイト)を超えています`
    )
  }

  const [buffer] = await file.download()
  const contentType = inferContentTypeFromPath(photoPath)
  const resizedBuffer = await imageResizeService.resize(buffer, contentType)
  await file.save(resizedBuffer, {
    contentType,
    resumable: false,
  })
}

/**
 * Storage上の写真群を{@link RESIZE_CONCURRENCY}件ずつ並列でダウンロードし、
 * ImageResizeServiceでリサイズ・圧縮した上で同一パスへ書き戻す
 *
 * @remarks
 * DB登録前に実行することで、以後のAPIレスポンスやDB上のphotoUrlには
 * 影響を与えずに実体ファイルのみをコンパクト化する。
 * 呼び出し元で所有権確認を終えたパスのみを渡すこと。
 *
 * @param bucket - 対象のStorageバケット
 * @param photoPaths - リサイズ・書き戻し対象の写真パス一覧
 */
const resizeAndReplaceStoredPhotos = async (
  bucket: ReturnType<typeof getBucket>,
  photoPaths: string[]
): Promise<void> => {
  for (let i = 0; i < photoPaths.length; i += RESIZE_CONCURRENCY) {
    const chunk = photoPaths.slice(i, i + RESIZE_CONCURRENCY)
    await Promise.all(
      chunk.map((photoPath) => resizeAndReplaceStoredPhoto(bucket, photoPath))
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
  honoAdminMiddleware,
  zodValidateJson(PhotoUploadUrlRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const userId = userEntity.id
    const { files } = c.req.valid('json')

    const bucketName = getStorageBucketName()
    const bucket = getBucket()
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
        expires: getCurrentDate().getTime() + SIGNED_URL_EXPIRY_MS,
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
  honoAdminMiddleware,
  zodValidateJson(PhotoRegisterForTouringRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const userId = userEntity.id
    const touringId = c.req.param('touringId')
    const { photos } = c.req.valid('json')

    // photoPathが自分のパスに属するか検証
    for (const p of photos) {
      validatePhotoPath(p.photoPath, userId)
    }

    const service = createPhotoService()

    // 所有権確認より先にStorageへ書き込み副作用を与えないよう、
    // リサイズ処理の前に必ず所有権を検証する
    await service.requireTouringOwnership(
      createTouringId(touringId),
      createUserId(userId)
    )

    // Firebase Storage から photoUrl を取得
    const bucket = getBucket()

    // Storage上の実体ファイルをリサイズ・圧縮して同一パスへ書き戻す
    await resizeAndReplaceStoredPhotos(
      bucket,
      photos.map((p) => p.photoPath)
    )

    const photosWithUrls = await Promise.all(
      photos.map(async (p) => {
        const url = await generateReadSignedUrl(bucket, p.photoPath)
        return { ...p, photoUrl: url }
      })
    )

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
          toApiResponsePhotoDetail(entity, entity.photoUrl)
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
photo.get(
  '/touring/:touringId',
  honoAuthMiddleware,
  honoAdminMiddleware,
  async (c) => {
    const { userEntity } = c.var.user!
    const userId = userEntity.id
    const touringId = c.req.param('touringId')

    const service = createPhotoService()
    const photos = await service.getPhotosByTouringId(
      createTouringId(touringId),
      createUserId(userId)
    )

    const bucket = getBucket()
    const data = await Promise.all(
      photos.map(async (entity) => {
        const photoUrl = await generateReadSignedUrl(bucket, entity.storagePath)
        return toApiResponsePhotoDetail(entity, photoUrl)
      })
    )

    return c.json<SuccessResponse<ApiResponseTouringPhotoList>>({
      status: 'success',
      data,
      message: 'ツーリング写真一覧取得成功',
    })
  }
)

/**
 * POST /api/v1/photo/touring/:touringId/spot/:spotId
 * スポットに写真を追加する
 */
photo.post(
  '/touring/:touringId/spot/:spotId',
  honoAuthMiddleware,
  honoAdminMiddleware,
  zodValidateJson(PhotoRegisterForSpotRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const userId = userEntity.id
    const touringId = c.req.param('touringId')
    const spotId = c.req.param('spotId')
    const { photos } = c.req.valid('json')

    for (const p of photos) {
      validatePhotoPath(p.photoPath, userId)
    }

    const service = createPhotoService()

    // 所有権確認より先にStorageへ書き込み副作用を与えないよう、
    // リサイズ処理の前に必ず所有権を検証する
    await service.requireSpotOwnership(
      createSpotId(spotId),
      createTouringId(touringId),
      createUserId(userId)
    )

    const bucket = getBucket()

    // Storage上の実体ファイルをリサイズ・圧縮して同一パスへ書き戻す
    await resizeAndReplaceStoredPhotos(
      bucket,
      photos.map((p) => p.photoPath)
    )

    const photosWithUrls = await Promise.all(
      photos.map(async (p) => {
        const url = await generateReadSignedUrl(bucket, p.photoPath)
        return { ...p, photoUrl: url }
      })
    )

    const created = await service.registerPhotosForSpot({
      userId: createUserId(userId),
      touringId: createTouringId(touringId),
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
          toApiResponsePhotoDetail(entity, entity.photoUrl)
        ),
        message: 'スポット写真登録成功',
      },
      201
    )
  }
)

/**
 * GET /api/v1/photo/touring/:touringId/spot/:spotId
 * スポットの写真一覧を取得する
 */
photo.get(
  '/touring/:touringId/spot/:spotId',
  honoAuthMiddleware,
  honoAdminMiddleware,
  async (c) => {
    const { userEntity } = c.var.user!
    const userId = userEntity.id
    const touringId = c.req.param('touringId')
    const spotId = c.req.param('spotId')

    const service = createPhotoService()
    const photos = await service.getPhotosBySpotId(
      createSpotId(spotId),
      createTouringId(touringId),
      createUserId(userId)
    )

    const bucket = getBucket()
    const data = await Promise.all(
      photos.map(async (entity) => {
        const photoUrl = await generateReadSignedUrl(bucket, entity.storagePath)
        return toApiResponsePhotoDetail(entity, photoUrl)
      })
    )

    return c.json<SuccessResponse<ApiResponseSpotPhotoList>>({
      status: 'success',
      data,
      message: 'スポット写真一覧取得成功',
    })
  }
)

/**
 * POST /api/v1/photo/bike/:myUserBikeId
 * バイク本体に写真を追加する（ツーリング/スポットを介さない日常の1枚）
 */
photo.post(
  '/bike/:myUserBikeId',
  honoAuthMiddleware,
  honoAdminMiddleware,
  zodValidateJson(PhotoRegisterForBikeRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const userId = userEntity.id
    const myUserBikeId = c.req.param('myUserBikeId')
    const { photos } = c.req.valid('json')

    for (const p of photos) {
      validatePhotoPath(p.photoPath, userId)
    }

    const service = createPhotoService()

    // 所有権確認より先にStorageへ書き込み副作用を与えないよう、
    // リサイズ処理の前に必ず所有権を検証する
    await service.requireMyUserBikeOwnership(
      createMyUserBikeId(myUserBikeId),
      createUserId(userId)
    )

    const bucket = getBucket()

    // Storage上の実体ファイルをリサイズ・圧縮して同一パスへ書き戻す
    await resizeAndReplaceStoredPhotos(
      bucket,
      photos.map((p) => p.photoPath)
    )

    const photosWithUrls = await Promise.all(
      photos.map(async (p) => {
        const url = await generateReadSignedUrl(bucket, p.photoPath)
        return { ...p, photoUrl: url }
      })
    )

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
        data: created.map((entity) =>
          toApiResponsePhotoDetail(entity, entity.photoUrl)
        ),
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
photo.get(
  '/bike/:myUserBikeId',
  honoAuthMiddleware,
  honoAdminMiddleware,
  async (c) => {
    const { userEntity } = c.var.user!
    const userId = userEntity.id
    const myUserBikeId = c.req.param('myUserBikeId')

    const service = createPhotoService()
    const photos = await service.getPhotosByMyBikeId(
      createMyUserBikeId(myUserBikeId),
      createUserId(userId)
    )

    const bucket = getBucket()
    const data = await Promise.all(
      photos.map(async (entity) => {
        const photoUrl = await generateReadSignedUrl(bucket, entity.storagePath)
        return toApiResponsePhotoDetail(entity, photoUrl)
      })
    )

    return c.json<SuccessResponse<ApiResponseBikePhotoList>>({
      status: 'success',
      data,
      message: 'バイク写真一覧取得成功',
    })
  }
)

/**
 * GET /api/v1/photo
 * ユーザーの全写真を横断して取得する（マイフォト・ギャラリー、ページネーション対応）
 * ツーリング/スポット/バイクいずれの紐づけかは attachedTo で返す
 */
photo.get('/', honoAuthMiddleware, honoAdminMiddleware, async (c) => {
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

  const service = createPhotoService()
  const photos = await service.getPhotosByUserId(createUserId(userId), {
    page,
    pageSize,
  })

  const bucket = getBucket()
  const data = await Promise.all(
    photos.map(async (entity) => {
      const photoUrl = await generateReadSignedUrl(bucket, entity.storagePath)
      return {
        ...toApiResponsePhotoDetail(entity, photoUrl),
        attachments: entity.attachments.map((attachment) =>
          attachment.type === 'TOURING'
            ? { type: 'TOURING' as const, touringId: attachment.touringId }
            : attachment.type === 'SPOT'
              ? { type: 'SPOT' as const, spotId: attachment.spotId }
              : {
                  type: 'BIKE' as const,
                  myUserBikeId: attachment.myUserBikeId,
                }
        ),
      }
    })
  )

  return c.json<SuccessResponse<ApiResponseUserPhotoList>>({
    status: 'success',
    data,
    message: 'マイフォト一覧取得成功',
  })
})

/**
 * DELETE /api/v1/photo/:photoId
 * 写真を削除する（Storage上のファイルも削除）
 */
photo.delete(
  '/:photoId',
  honoAuthMiddleware,
  honoAdminMiddleware,
  async (c) => {
    const { userEntity } = c.var.user!
    const userId = userEntity.id
    const photoId = c.req.param('photoId')

    const service = createPhotoService()

    const storagePath = await service.deletePhoto({
      photoId: createPhotoId(photoId),
      userId: createUserId(userId),
    })

    // Firebase Storage からファイルを削除
    const bucket = getBucket()
    await bucket.file(storagePath).delete({ ignoreNotFound: true })

    return c.json<SuccessResponse<undefined>>({
      status: 'success',
      data: undefined,
      message: '写真削除成功',
    })
  }
)

export default photo
