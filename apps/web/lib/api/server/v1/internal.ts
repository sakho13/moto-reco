import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseInternalPurgeQuitUsers,
  SuccessResponse,
} from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'
import { honoSystemApiKeyMiddleware } from '../middlewares/honoSystemApiKey'
import { PrismaPurgeUserRepository } from '../repositories/PrismaPurgeUserRepository'
import { PrismaUserQuitRepository } from '../repositories/PrismaUserQuitRepository'
import { PurgeUserService } from '../services/PurgeUserService'
import { HonoVariables } from '../types/hono'

const internal = new Hono<{ Variables: HonoVariables }>()

/**
 * 猶予期間（30日）を超過した退会ユーザーを完全物理削除する内部API
 *
 * @remarks
 * GitHub Actionsの週次スケジュール（`.github/workflows/purge-quit-users.yml`）から
 * 呼び出される想定。`MSystemApiKey` によるハッシュ照合ミドルウェアで保護する。
 */
internal.post('/purge-quit-users', honoSystemApiKeyMiddleware, async (c) => {
  const service = new PurgeUserService(
    new PrismaUserQuitRepository(prisma),
    new PrismaPurgeUserRepository(prisma)
  )

  const result = await service.purgeExpiredQuitUsers(getCurrentDate())

  return c.json<SuccessResponse<ApiResponseInternalPurgeQuitUsers>>({
    status: 'success',
    data: result,
    message: `完全削除バッチが完了しました（成功: ${result.succeededUserIds.length}件 / 失敗: ${result.failedUserIds.length}件）`,
  })
})

export default internal
