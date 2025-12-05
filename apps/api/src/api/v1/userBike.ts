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
 * 新規購入または未登録の中古バイクを登録します。
 * 既にアプリに登録されているバイク（車台番号が登録済み）の場合はエラーを返します。
 *
 * @route POST /api/v1/user-bike/register
 * @param {UserBikeRegisterRequest} body - バイク登録情報
 * @returns {201} バイク登録成功
 * @throws {400} バリデーションエラー、車台番号重複
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

      // 車台番号の重複確認
      const existingUserBike = await userBikeRepo.findBySerialNumber(
        body.serialNumber
      )
      if (existingUserBike) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          'この車台番号は既に登録されています。既に登録されているバイクの場合は転送機能をご利用ください。'
        )
      }

      // バイク登録
      return await userBikeRepo.registerUserBike({
        userId,
        bikeId: createBikeId(body.bikeId),
        serialNumber: body.serialNumber,
        nickname: body.nickname,
        purchaseDate: body.purchaseDate,
        purchasePrice: body.purchasePrice,
        purchaseMileage: body.purchaseMileage,
      })
    })

    return c.json<SuccessResponse<ApiResponseUserBikeRegister>>(
      {
        status: 'success',
        data: {
          myUserBikeId: result.userMyBike.myUserBikeId,
          userBikeId: result.userBike.userBikeId,
          bikeId: result.userBike.bikeId,
          serialNumber: result.userBike.serialNumber,
          nickname: result.userMyBike.nickname,
          bike: result.bike,
        },
        message: 'バイク登録成功',
      },
      201
    )
  }
)

userBike.get('/bike/:userBikeId', honoAuthMiddleware, async (c) => {
  return c.json({})
})

export default userBike
