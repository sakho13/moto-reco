import { createMiddleware } from 'hono/factory'
import { ApiV1Error } from '@repo/shared-domain'
import { HonoVariables } from '../types/hono'

/**
 * ADMIN ロール専用ミドルウェア
 * honoAuthMiddleware の後に使用すること
 */
export const honoAdminMiddleware = createMiddleware<{
  Variables: HonoVariables
}>(async (c, next) => {
  const user = c.var.user
  if (!user || user.userEntity.role !== 'ADMIN') {
    throw new ApiV1Error('FORBIDDEN', '管理者権限が必要です')
  }
  await next()
})
