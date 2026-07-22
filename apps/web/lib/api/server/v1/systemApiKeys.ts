import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@repo/database'
import {
  ApiResponseSystemApiKeyGenerate,
  ApiResponseSystemApiKeyList,
  SuccessResponse,
} from '@repo/shared-types'
import { ApiV1Error } from '../errors/ApiV1Error'
import { honoAdminMiddleware } from '../middlewares/honoAdmin'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateJson } from '../middlewares/zodValidation'
import { PrismaSystemApiKeyRepository } from '../repositories/PrismaSystemApiKeyRepository'
import { SystemApiKeyService } from '../services/SystemApiKeyService'
import { HonoVariables } from '../types/hono'

const systemApiKeys = new Hono<{ Variables: HonoVariables }>()

const GenerateSystemApiKeySchema = z.object({
  name: z.string().min(1).max(50),
})

const UpdateSystemApiKeySchema = z.object({
  isActive: z.boolean(),
})

/** システムAPIキー一覧取得（管理者専用） */
systemApiKeys.get('/', honoAuthMiddleware, honoAdminMiddleware, async (c) => {
  const service = new SystemApiKeyService(
    new PrismaSystemApiKeyRepository(prisma)
  )
  const keys = await service.listApiKeys()

  return c.json<SuccessResponse<ApiResponseSystemApiKeyList>>({
    status: 'success',
    data: {
      systemApiKeys: keys.map((k) => ({
        systemApiKeyId: k.id,
        name: k.name,
        prefix: k.prefix,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
        createdAt: k.createdAt.toISOString(),
      })),
    },
    message: 'システムAPIキー一覧取得成功',
  })
})

/** システムAPIキー発行（管理者専用） */
systemApiKeys.post(
  '/',
  honoAuthMiddleware,
  honoAdminMiddleware,
  zodValidateJson(GenerateSystemApiKeySchema),
  async (c) => {
    const body = c.req.valid('json')

    const service = new SystemApiKeyService(
      new PrismaSystemApiKeyRepository(prisma)
    )
    const { systemApiKey, fullKey } = await service.generateApiKey({
      name: body.name,
    })

    return c.json<SuccessResponse<ApiResponseSystemApiKeyGenerate>>(
      {
        status: 'success',
        data: {
          systemApiKeyId: systemApiKey.id,
          name: systemApiKey.name,
          prefix: systemApiKey.prefix,
          isActive: systemApiKey.isActive,
          lastUsedAt: systemApiKey.lastUsedAt?.toISOString() ?? null,
          createdAt: systemApiKey.createdAt.toISOString(),
          fullKey,
        },
        message:
          'システムAPIキーを発行しました。このキーは二度と表示されません。',
      },
      201
    )
  }
)

/** システムAPIキーのisActive切替（管理者専用） */
systemApiKeys.patch(
  '/:id',
  honoAuthMiddleware,
  honoAdminMiddleware,
  zodValidateJson(UpdateSystemApiKeySchema),
  async (c) => {
    const id = c.req.param('id')
    if (!id) {
      throw new ApiV1Error('INVALID_REQUEST', 'idが指定されていません')
    }
    const body = c.req.valid('json')

    const service = new SystemApiKeyService(
      new PrismaSystemApiKeyRepository(prisma)
    )
    await service.setActive(id, body.isActive)

    return c.json<SuccessResponse<null>>({
      status: 'success',
      data: null,
      message: body.isActive
        ? 'システムAPIキーを有効化しました'
        : 'システムAPIキーを失効しました',
    })
  }
)

export default systemApiKeys
