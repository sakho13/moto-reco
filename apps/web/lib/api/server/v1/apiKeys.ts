import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { SuccessResponse } from '@repo/shared-types'
import { ApiV1Error } from '../errors/ApiV1Error'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateJson } from '../middlewares/zodValidation'
import { PrismaApiKeyRepository } from '../repositories/PrismaApiKeyRepository'
import { ApiKeyService } from '../services/ApiKeyService'
import { HonoVariables } from '../types/hono'

const apiKeys = new Hono<{ Variables: HonoVariables }>()

export type ApiResponseApiKeyItem = {
  apiKeyId: string
  name: string
  prefix: string
  createdAt: string
}

export type ApiResponseApiKeyList = {
  apiKeys: ApiResponseApiKeyItem[]
}

export type ApiResponseApiKeyGenerate = {
  apiKeyId: string
  name: string
  prefix: string
  fullKey: string
  createdAt: string
}

const GenerateApiKeySchema = z.object({
  name: z.string().min(1).max(50),
})

/** APIキー一覧取得 */
apiKeys.get('/', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!

  const service = new ApiKeyService(new PrismaApiKeyRepository(prisma))
  const keys = await service.listApiKeys({ user: userEntity })

  return c.json<SuccessResponse<ApiResponseApiKeyList>>({
    status: 'success',
    data: {
      apiKeys: keys.map((k) => ({
        apiKeyId: k.id,
        name: k.name,
        prefix: k.prefix,
        createdAt: k.createdAt.toISOString(),
      })),
    },
    message: 'APIキー一覧取得成功',
  })
})

/** APIキー生成 */
apiKeys.post(
  '/',
  honoAuthMiddleware,
  zodValidateJson(GenerateApiKeySchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const body = c.req.valid('json')

    const service = new ApiKeyService(new PrismaApiKeyRepository(prisma))
    const { apiKey, fullKey } = await service.generateApiKey({
      user: userEntity,
      name: body.name,
    })

    return c.json<SuccessResponse<ApiResponseApiKeyGenerate>>(
      {
        status: 'success',
        data: {
          apiKeyId: apiKey.id,
          name: apiKey.name,
          prefix: apiKey.prefix,
          fullKey,
          createdAt: apiKey.createdAt.toISOString(),
        },
        message: 'APIキーを発行しました。このキーは二度と表示されません。',
      },
      201
    )
  }
)

/** APIキー失効 */
apiKeys.patch('/:apiKeyId/revoke', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!
  const apiKeyId = c.req.param('apiKeyId')

  const service = new ApiKeyService(new PrismaApiKeyRepository(prisma))
  await service.revokeApiKey({ user: userEntity, apiKeyId })

  return c.json<SuccessResponse<null>>({
    status: 'success',
    data: null,
    message: 'APIキーを失効しました',
  })
})

/** APIキー削除 */
apiKeys.delete('/:apiKeyId', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!
  const apiKeyId = c.req.param('apiKeyId')

  if (!apiKeyId) {
    throw new ApiV1Error('INVALID_REQUEST', 'apiKeyId が指定されていません')
  }

  const service = new ApiKeyService(new PrismaApiKeyRepository(prisma))
  await service.deleteApiKey({ user: userEntity, apiKeyId })

  return c.json<SuccessResponse<null>>({
    status: 'success',
    data: null,
    message: 'APIキーを削除しました',
  })
})

export default apiKeys
