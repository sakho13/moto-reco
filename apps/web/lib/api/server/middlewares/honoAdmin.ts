import { Context, Next } from 'hono'
import { ApiV1Error } from '../errors/ApiV1Error'
import { HonoVariables } from '../types/hono'

/**
 * ADMIN ロール専用ミドルウェア
 * honoAuthMiddleware の後に使用すること
 */
export async function honoAdminMiddleware(
  c: Context<{ Variables: HonoVariables }>,
  next: Next
) {
  const user = c.var.user
  if (!user || user.role !== 'ADMIN') {
    throw new ApiV1Error('FORBIDDEN', '管理者権限が必要です')
  }
  await next()
}
