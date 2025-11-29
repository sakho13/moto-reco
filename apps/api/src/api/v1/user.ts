import { Hono } from 'hono'
import { honoAuthMiddleware } from '../../lib/middlewares/honoAuth'
import { PrismaUserRepository } from '../../lib/classes/repositories/PrismaUserRepository'
import { prisma } from '@packages/database'
import { ApiV1Error } from '../../lib/classes/common/ApiV1Error'
import { SuccessResponse } from '@shared-types/index'

const user = new Hono()

user.get('/profile', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!

  const userRepo = new PrismaUserRepository(prisma)
  const user = await userRepo.findById(userId)

  if (!user) {
    throw new ApiV1Error('USER_NOT_REGISTERED', 'ユーザーが見つかりません')
  }

  return c.json<SuccessResponse<{ name: string }>>({
    status: 'success',
    data: {
      name: user.name,
    },
    message: 'プロフィール取得成功',
  })
})

user.post('/profile', honoAuthMiddleware, (c) => {
  return c.json({})
})

user.post('/register', (c) => {
  return c.json({})
})
