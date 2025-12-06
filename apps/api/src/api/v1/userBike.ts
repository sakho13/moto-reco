import { Hono } from 'hono'
import { prisma } from '@packages/database'
import {
  ApiResponseUserBikeRegister,
  createBikeId,
  SuccessResponse,
  UserBikeRegisterRequestSchema,
} from '@shared-types/index'
import { ApiV1Error } from '../../lib/classes/common/ApiV1Error'
import { PrismaUserBikeRepository } from '../../lib/classes/repositories/PrismaUserBikeRepository'
import { PrismaUserRepository } from '../../lib/classes/repositories/PrismaUserRepository'
import { honoAuthMiddleware } from '../../lib/middlewares/honoAuth'
import { zodValidateJson } from '../../lib/middlewares/zodValidation'

const userBike = new Hono()

userBike.get('/bikes', honoAuthMiddleware, async (c) => {
  return c.json({})
})

/**
 * ユーザーバイク登録エンドポイント
 *
 * ユーザーが所有するバイクを登録します。
 *
 * @route POST /api/v1/user-bike/register
 * @param {UserBikeRegisterRequest} body - バイク登録情報
 * @returns {201} バイク登録成功
 * @throws {400} バリデーションエラー
 * @throws {401} 認証失敗
 * @throws {404} バイク車種が見つからない
 */
userBike.post(
  '/register',
  honoAuthMiddleware,
  zodValidateJson(UserBikeRegisterRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const body = c.req.valid('json')

    // ユーザーの存在確認
    const userRepo = new PrismaUserRepository(prisma)
    const user = await userRepo.findById(userId)
    if (!user) {
      throw new ApiV1Error('USER_NOT_REGISTERED', 'ユーザーが見つかりません')
    }

    // トランザクション内でバイク登録処理
    const result = await prisma.$transaction(async (t) => {
      const userBikeRepo = new PrismaUserBikeRepository(t)

      return await userBikeRepo.registerUserBike({
        userId,
        bikeId: createBikeId(body.userBikeId),
        nickname: body.nickname,
        purchaseDate: body.purchaseDate,
        mileage: body.mileage,
      })
    })

    return c.json<SuccessResponse<ApiResponseUserBikeRegister>>(
      {
        status: 'success',
        data: {
          userBikeId: result.userBikeId,
          manufacturerName: result.manufacturerName,
          bikeId: result.bikeId,
          modelName: result.modelName,
          nickname: result.nickname,
          purchaseDate: result.purchaseDate?.toISOString() ?? null,
          totalMileage: result.totalMileage,
          displacement: result.displacement,
          modelYear: result.modelYear,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
        },
        message: 'ユーザー所有バイク登録成功',
      },
      201
    )
  }
)

userBike.get('/bike/:userBikeId', honoAuthMiddleware, async (c) => {
  return c.json({})
})

export default userBike
