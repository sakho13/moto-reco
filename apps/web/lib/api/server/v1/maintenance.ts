import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { ApiV1Error } from '@repo/shared-domain'
import {
  ApiResponseMaintenanceItems,
  createMyUserBikeId,
  SuccessResponse,
} from '@repo/shared-types'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { PrismaMyUserBikeRepository } from '../repositories/PrismaMyUserBikeRepository'
import { MaintenanceService } from '../services/MaintenanceService'

const maintenance = new Hono()

/**
 * GET /api/v1/maintenance/items
 *
 * メンテナンス項目一覧を取得
 * クエリパラメータ:
 *   - myUserBikeId: ユーザバイクID（必須）
 */
maintenance.get('/items', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!
  const myUserBikeId = c.req.query('myUserBikeId')

  // バリデーション
  if (!myUserBikeId) {
    throw new ApiV1Error('INVALID_REQUEST', 'myUserBikeIdを指定してください')
  }

  // サービス実行
  const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
  const maintenanceService = new MaintenanceService(myUserBikeRepo)

  const maintenanceItems = await maintenanceService.getMaintenanceItems(
    createMyUserBikeId(myUserBikeId),
    userEntity.id
  )

  return c.json<SuccessResponse<ApiResponseMaintenanceItems>>({
    status: 'success',
    data: {
      maintenanceItems,
    },
    message: 'メンテナンス項目取得成功',
  })
})

export default maintenance
