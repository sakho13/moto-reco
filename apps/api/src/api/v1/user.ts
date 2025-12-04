import { Hono } from 'hono'
import { prisma } from '@packages/database'
import {
  ApiResponseUserProfile,
  SuccessResponse,
  UserAuthRegisterRequestSchema,
  UserProfileUpdateRequestSchema,
} from '@shared-types/index'
import { ApiV1Error } from '../../lib/classes/common/ApiV1Error'
import { FirebaseAuthRepository } from '../../lib/classes/repositories/FirebaseAuthRepository'
import { PrismaUserRepository } from '../../lib/classes/repositories/PrismaUserRepository'
import { UserService } from '../../lib/classes/services/UserService'
import { honoAuthMiddleware } from '../../lib/middlewares/honoAuth'
import { zodValidateJson } from '../../lib/middlewares/zodValidation'

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

export default user
