import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { UserGoodsEntity, UserGoodsSearchParams } from '@repo/shared-domain'
import {
  ApiResponseUserGoodsDetail,
  ApiResponseUserGoodsList,
  createGoodsModelId,
  createMyUserBikeId,
  createUserGoodsId,
  MyUserBikeId,
  SuccessResponse,
  UserGoodsDetailParamSchema,
  UserGoodsListQuerySchema,
  UserGoodsRegisterRequestSchema,
  UserGoodsUpdateRequestSchema,
} from '@repo/shared-types'
import { honoAdminMiddleware } from '../middlewares/honoAdmin'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import {
  zodValidateJson,
  zodValidateParam,
  zodValidateQuery,
} from '../middlewares/zodValidation'
import { PrismaGoodsModelRepository } from '../repositories/PrismaGoodsModelRepository'
import { PrismaMyUserBikeRepository } from '../repositories/PrismaMyUserBikeRepository'
import { PrismaUserGoodsRepository } from '../repositories/PrismaUserGoodsRepository'
import { UserGoodsService } from '../services/UserGoodsService'

const userGoods = new Hono()

/**
 * リクエストボディの `userMyBikeId` (未指定/null/文字列) を
 * サービス層で扱う `MyUserBikeId | null | undefined` へ変換する
 */
function toMyUserBikeIdParam(
  value: string | null | undefined
): MyUserBikeId | null | undefined {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  return createMyUserBikeId(value)
}

function toResponseData(entity: UserGoodsEntity): ApiResponseUserGoodsDetail {
  return {
    userGoodsId: entity.id,
    userMyBikeId: entity.userMyBikeId,
    purchasedAt: entity.purchasedAt ? entity.purchasedAt.toISOString() : null,
    price: entity.price,
    memo: entity.memo,
    goodsModelId: entity.goodsModelId,
    goodsManufacturerId: entity.goodsManufacturerId,
    manufacturerName: entity.manufacturerName,
    modelNumber: entity.modelNumber,
    modelName: entity.modelName,
    category: entity.category,
    amazonUrl: entity.amazonUrl,
    rakutenUrl: entity.rakutenUrl,
    officialUrl: entity.officialUrl,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  }
}

userGoods.get(
  '/',
  honoAuthMiddleware,
  honoAdminMiddleware,
  zodValidateQuery(UserGoodsListQuerySchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const query = c.req.valid('query')

    const searchParams = new UserGoodsSearchParams({
      page: query.page,
      pageSize: query['per-size'],
      myUserBikeId: query.myUserBikeId
        ? createMyUserBikeId(query.myUserBikeId)
        : undefined,
    })

    const userGoodsRepo = new PrismaUserGoodsRepository(prisma)
    const goodsModelRepo = new PrismaGoodsModelRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const service = new UserGoodsService(
      userGoodsRepo,
      goodsModelRepo,
      myUserBikeRepo
    )

    const list = await service.getUserGoodsList(userEntity.id, searchParams)

    return c.json<SuccessResponse<ApiResponseUserGoodsList>>(
      {
        status: 'success',
        data: list.map((entity) => toResponseData(entity)),
        message: '購入グッズ一覧取得成功',
      },
      200
    )
  }
)

userGoods.get(
  '/:userGoodsId',
  honoAuthMiddleware,
  honoAdminMiddleware,
  zodValidateParam(UserGoodsDetailParamSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const params = c.req.valid('param')

    const userGoodsRepo = new PrismaUserGoodsRepository(prisma)
    const goodsModelRepo = new PrismaGoodsModelRepository(prisma)
    const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
    const service = new UserGoodsService(
      userGoodsRepo,
      goodsModelRepo,
      myUserBikeRepo
    )

    const detail = await service.getUserGoodsDetail(
      createUserGoodsId(params.userGoodsId),
      userEntity.id
    )

    return c.json<SuccessResponse<ApiResponseUserGoodsDetail>>({
      status: 'success',
      data: toResponseData(detail),
      message: '購入グッズ詳細取得成功',
    })
  }
)

userGoods.post(
  '/',
  honoAuthMiddleware,
  honoAdminMiddleware,
  zodValidateJson(UserGoodsRegisterRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const userGoodsRepo = new PrismaUserGoodsRepository(t)
      const goodsModelRepo = new PrismaGoodsModelRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new UserGoodsService(
        userGoodsRepo,
        goodsModelRepo,
        myUserBikeRepo
      )

      return await service.registerUserGoods({
        user: userEntity,
        goodsModelId: createGoodsModelId(body.goodsModelId),
        userMyBikeId: toMyUserBikeIdParam(body.userMyBikeId),
        purchasedAt: body.purchasedAt,
        price: body.price,
        memo: body.memo,
      })
    })

    return c.json<SuccessResponse<ApiResponseUserGoodsDetail>>(
      {
        status: 'success',
        data: toResponseData(result),
        message: '購入グッズ登録成功',
      },
      201
    )
  }
)

userGoods.patch(
  '/:userGoodsId',
  honoAuthMiddleware,
  honoAdminMiddleware,
  zodValidateParam(UserGoodsDetailParamSchema),
  zodValidateJson(UserGoodsUpdateRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const params = c.req.valid('param')
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const userGoodsRepo = new PrismaUserGoodsRepository(t)
      const goodsModelRepo = new PrismaGoodsModelRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new UserGoodsService(
        userGoodsRepo,
        goodsModelRepo,
        myUserBikeRepo
      )

      return await service.updateUserGoods({
        userGoodsId: createUserGoodsId(params.userGoodsId),
        userId: userEntity.id,
        goodsModelId: body.goodsModelId
          ? createGoodsModelId(body.goodsModelId)
          : undefined,
        userMyBikeId: toMyUserBikeIdParam(body.userMyBikeId),
        purchasedAt: body.purchasedAt,
        price: body.price,
        memo: body.memo,
      })
    })

    return c.json<SuccessResponse<ApiResponseUserGoodsDetail>>(
      {
        status: 'success',
        data: toResponseData(result),
        message: '購入グッズ更新成功',
      },
      200
    )
  }
)

userGoods.delete(
  '/:userGoodsId',
  honoAuthMiddleware,
  honoAdminMiddleware,
  zodValidateParam(UserGoodsDetailParamSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const params = c.req.valid('param')

    await prisma.$transaction(async (t) => {
      const userGoodsRepo = new PrismaUserGoodsRepository(t)
      const goodsModelRepo = new PrismaGoodsModelRepository(t)
      const myUserBikeRepo = new PrismaMyUserBikeRepository(t)
      const service = new UserGoodsService(
        userGoodsRepo,
        goodsModelRepo,
        myUserBikeRepo
      )

      await service.deleteUserGoods({
        userGoodsId: createUserGoodsId(params.userGoodsId),
        userId: userEntity.id,
      })
    })

    return c.json<SuccessResponse<undefined>>(
      {
        status: 'success',
        message: '購入グッズ削除成功',
        data: undefined,
      },
      200
    )
  }
)

export default userGoods
