import { Hono } from 'hono'
import { SuccessResponse } from '@repo/shared-types'
import { honoAdminAuthMiddleware } from '../middlewares/honoAdminAuth'
import { HonoVariables } from '../types/hono'

const ApiAdminV1 = new Hono<{ Variables: HonoVariables }>()

/**
 * 管理者情報取得エンドポイント
 * ログイン中の管理者情報を返す（クライアント側ロールチェックに使用）
 */
ApiAdminV1.get('/auth/me', honoAdminAuthMiddleware, async (c) => {
  const user = c.var.user!

  return c.json({
    status: 'success',
    data: {
      userId: user.userId,
      email: user.email,
    },
  } satisfies SuccessResponse<{ userId: string; email?: string }>)
})

export default ApiAdminV1
