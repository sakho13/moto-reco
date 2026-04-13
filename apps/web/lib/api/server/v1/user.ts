import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseUserProfile,
  ApiResponseUserQuit,
  ApiResponseUserRecover,
  GuestRegisterRequestSchema,
  GuestUpgradeRequestSchema,
  ProviderType,
  SuccessResponse,
  UserAuthRecoverRequestSchema,
  UserAuthQuitRequestSchema,
  UserAuthRegisterRequestSchema,
  UserProfileUpdateRequestSchema,
} from '@repo/shared-types'
import { ApiV1Error } from '../errors/ApiV1Error'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateJson } from '../middlewares/zodValidation'
import { FirebaseAuthRepository } from '../repositories/FirebaseAuthRepository'
import { PrismaAuthProviderRepository } from '../repositories/PrismaAuthProviderRepository'
import { PrismaUserQuitRepository } from '../repositories/PrismaUserQuitRepository'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { UserQuitService } from '../services/UserQuitService'
import { UserService } from '../services/UserService'

const user = new Hono()

user.get('/profile', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!

  const userRepo = new PrismaUserRepository(prisma)
  const user = await userRepo.findById(userId)

  if (!user) {
    throw new ApiV1Error('USER_NOT_REGISTERED', 'ユーザーが見つかりません')
  }

  return c.json<SuccessResponse<ApiResponseUserProfile>>({
    status: 'success',
    data: {
      userId: user.id,
      name: user.name,
    },
    message: 'プロフィール取得成功',
  })
})

/**
 * ユーザープロフィール更新エンドポイント
 *
 * @remarks
 * - 認証必須（honoAuthMiddleware）
 * - リクエストボディのバリデーション（zodValidateJson）
 * - nameフィールド: 1文字以上50文字以下
 */
user.post(
  '/profile',
  honoAuthMiddleware,
  zodValidateJson(UserProfileUpdateRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const body = c.req.valid('json') // 型安全に UserProfileUpdateRequest として取得

    const userRepo = new PrismaUserRepository(prisma)

    // ユーザーの存在確認
    const user = await userRepo.findById(userId)
    if (!user) {
      throw new ApiV1Error('USER_NOT_REGISTERED', 'ユーザーが見つかりません')
    }

    if (body.name) {
      user.name = body.name
    }

    // プロフィール更新
    const updatedUser = await userRepo.updateUser(user)

    return c.json<SuccessResponse<ApiResponseUserProfile>>({
      status: 'success',
      data: {
        userId: updatedUser.id,
        name: updatedUser.name,
      },
      message: 'プロフィール更新成功',
    })
  }
)

/**
 * ユーザー認証登録エンドポイント
 *
 * Firebase IDトークンによる認証後、ユーザー情報を登録します。
 * 既に同じ認証プロバイダーでユーザーが存在する場合は、既存ユーザー情報を返却します（冪等性）。
 *
 * @route POST /api/v1/user/auth/register
 * @param {UserAuthRegisterRequest} body.name - ユーザー名（1-50文字）
 * @returns {201} ユーザー登録成功
 * @throws {400} バリデーションエラー
 * @throws {401} 認証失敗
 * @throws {500} サーバーエラー
 */
user.post(
  '/auth/register',
  zodValidateJson(UserAuthRegisterRequestSchema),
  async (c) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが提供されていません')
    }

    const token = authHeader.substring('Bearer '.length)
    const firebaseAuthRepo = new FirebaseAuthRepository()
    const authProvider = await firebaseAuthRepo.authorize(token)

    if (!authProvider) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが無効です')
    }

    const body = c.req.valid('json')

    const user = await prisma.$transaction(async (t) => {
      const userRepo = new PrismaUserRepository(t)
      const service = new UserService(userRepo)

      const user = await service.createUser(authProvider, {
        name: body.name,
      })
      return user
    })

    return c.json<SuccessResponse<ApiResponseUserProfile>>(
      {
        status: 'success',
        data: {
          userId: user.id,
          name: user.name,
        },
        message: 'ユーザー登録成功',
      },
      201
    )
  }
)

/**
 * ユーザー退会エンドポイント
 *
 * @remarks
 * - 認証必須（honoAuthMiddleware）
 * - 退会理由の入力が必須
 * - 退会後に復帰コードを返却
 */
user.post(
  '/auth/quit',
  honoAuthMiddleware,
  zodValidateJson(UserAuthQuitRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const userRepo = new PrismaUserRepository(t)
      const authProviderRepo = new PrismaAuthProviderRepository(t)
      const userQuitRepo = new PrismaUserQuitRepository(t)
      const service = new UserQuitService(
        userRepo,
        authProviderRepo,
        userQuitRepo
      )

      return service.quitUser({
        userId,
        quitReason: body.quitReason,
      })
    })

    return c.json<SuccessResponse<ApiResponseUserQuit>>({
      status: 'success',
      data: {
        recoveryCode: result.recoveryCode,
      },
      message: '退会処理が完了しました',
    })
  }
)

/**
 * ユーザー復帰エンドポイント
 *
 * @remarks
 * - Firebase認証トークン必須
 * - 復帰コードの入力が必須
 */
user.post(
  '/auth/recover',
  zodValidateJson(UserAuthRecoverRequestSchema),
  async (c) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが提供されていません')
    }

    const token = authHeader.substring('Bearer '.length)
    const firebaseAuthRepo = new FirebaseAuthRepository()
    const authProvider = await firebaseAuthRepo.authorize(token)

    if (!authProvider) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが無効です')
    }

    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const userRepo = new PrismaUserRepository(t)
      const authProviderRepo = new PrismaAuthProviderRepository(t)
      const userQuitRepo = new PrismaUserQuitRepository(t)
      const service = new UserQuitService(
        userRepo,
        authProviderRepo,
        userQuitRepo
      )

      return service.recoverUser({
        externalId: authProvider.externalId,
        providerType: authProvider.provider,
        recoveryCode: body.recoveryCode,
      })
    })

    return c.json<SuccessResponse<ApiResponseUserRecover>>({
      status: 'success',
      data: {
        userId: result.userId,
      },
      message: '復帰処理が完了しました',
    })
  }
)

/**
 * ゲストユーザー登録エンドポイント
 *
 * Firebase匿名認証トークンを受け取り、ゲストユーザーを作成します。
 * 既に同じ匿名UIDでゲストユーザーが存在する場合は既存ユーザーを返します（冪等性）。
 *
 * @route POST /api/v1/user/auth/guest/register
 * @param {GuestRegisterRequest} body.name - ユーザー名（省略可）
 * @returns {201} ゲストユーザー登録成功
 * @throws {400} バリデーションエラー
 * @throws {401} 認証失敗
 * @throws {500} サーバーエラー
 */
user.post(
  '/auth/guest/register',
  zodValidateJson(GuestRegisterRequestSchema),
  async (c) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが提供されていません')
    }

    const token = authHeader.substring('Bearer '.length)
    const firebaseAuthRepo = new FirebaseAuthRepository()
    const authProvider = await firebaseAuthRepo.authorize(token)

    if (!authProvider) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが無効です')
    }

    // 匿名認証トークンのみ受け付ける
    if (authProvider.provider !== 'FIREBASE_ANONYMOUS') {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'ゲスト登録には匿名認証トークンが必要です'
      )
    }

    const body = c.req.valid('json')

    const guestUser = await prisma.$transaction(async (t) => {
      const userRepo = new PrismaUserRepository(t)
      const service = new UserService(userRepo)
      return service.createGuestUser(authProvider, { name: body.name })
    })

    return c.json<SuccessResponse<ApiResponseUserProfile>>(
      {
        status: 'success',
        data: {
          userId: guestUser.id,
          name: guestUser.name,
        },
        message: 'ゲストユーザー登録成功',
      },
      201
    )
  }
)

/**
 * ゲストアカウントを正規アカウントにアップグレードするエンドポイント
 *
 * Firebase Account Linking後のトークン（匿名UIDのままでプロバイダーが変わったもの）を受け取り、
 * ゲストアカウントを正規ユーザーに切り替えます。
 *
 * @route POST /api/v1/user/auth/guest/upgrade
 * @param {GuestUpgradeRequest} body.name - ユーザー名（省略可）
 * @returns {200} アップグレード成功
 * @throws {400} バリデーションエラー
 * @throws {401} 認証失敗
 * @throws {404} ゲストアカウントが見つからない
 * @throws {500} サーバーエラー
 */
user.post(
  '/auth/guest/upgrade',
  zodValidateJson(GuestUpgradeRequestSchema),
  async (c) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが提供されていません')
    }

    const token = authHeader.substring('Bearer '.length)
    const firebaseAuthRepo = new FirebaseAuthRepository()
    const authProvider = await firebaseAuthRepo.authorize(token)

    if (!authProvider) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが無効です')
    }

    // 匿名認証トークンはアップグレード済みではないためエラー
    if (authProvider.provider === 'FIREBASE_ANONYMOUS') {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'アップグレードにはメールまたはGoogleアカウントを連携してください'
      )
    }

    const body = c.req.valid('json')

    const upgradedUser = await prisma.$transaction(async (t) => {
      const userRepo = new PrismaUserRepository(t)
      const authProviderRepo = new PrismaAuthProviderRepository(t)
      const service = new UserService(userRepo)

      return service.upgradeGuestUser(
        authProvider.externalId,
        authProvider.provider as Exclude<ProviderType, 'FIREBASE_ANONYMOUS'>,
        authProviderRepo,
        body.name
      )
    })

    return c.json<SuccessResponse<ApiResponseUserProfile>>({
      status: 'success',
      data: {
        userId: upgradedUser.id,
        name: upgradedUser.name,
      },
      message: 'アカウントのアップグレードが完了しました',
    })
  }
)

export default user
