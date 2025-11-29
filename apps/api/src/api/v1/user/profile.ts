import { FastifyInstance } from 'fastify'
import { ApiV1Wrapper } from '../../../lib/classes/common/ApiV1Wrapper'
import { authMiddleware } from '../../../lib/middlewares/auth'
import { PrismaUserRepository } from '../../../lib/classes/repositories/PrismaUserRepository'
import { prisma } from '@packages/database'
import { ApiResUserProfile, createUserId } from '@shared-types/index'
import { ApiV1Error } from '../../../lib/classes/common/ApiV1Error'

export default async (fastify: FastifyInstance) => {
  fastify.get(
    '/api/v1/user/profile',
    {
      preHandler: authMiddleware,
    },
    async (request) => {
      const api = new ApiV1Wrapper()

      return await api.execute<ApiResUserProfile>(async () => {
        const { userId } = request.user!

        const userRepo = new PrismaUserRepository(prisma)
        const user = await userRepo.findById(createUserId(userId))

        if (!user) {
          throw new ApiV1Error('AUTH_FAILED', 'ユーザーが見つかりません')
        }

        return {
          result: {
            id: user.id,
            name: user.name,
          },
          message: 'プロフィール取得成功',
        }
      })
    }
  )
}
