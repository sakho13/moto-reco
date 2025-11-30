import { Hono } from 'hono'
import { prisma } from '@packages/database'
import {
  ApiResponseUserProfile,
  SuccessResponse,
  UserProfileUpdateRequestSchema,
} from '@shared-types/index'
import { ApiV1Error } from '../../lib/classes/common/ApiV1Error'
import { PrismaUserRepository } from '../../lib/classes/repositories/PrismaUserRepository'
import { honoAuthMiddleware } from '../../lib/middlewares/honoAuth'
import { zodValidateJson } from '../../lib/middlewares/zodValidation'
import { UserEntity } from '../../lib/classes/entities/UserEntity'

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

    // プロフィール更新
    const updatedUser = await userRepo.updateUser(
      new UserEntity({
        ...user.toJson(),
        name: body.name,
      })
    )

    return c.json<SuccessResponse<ApiResponseUserProfile>>({
      status: 'success',
      data: {
        name: updatedUser.name,
      },
      message: 'プロフィール更新成功',
    })
  }
)

user.post('/auth/register', (c) => {
  const authHeader = c.req.header('Authorization')

  return c.json({})
})

export default user
