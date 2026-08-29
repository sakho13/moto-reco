import {
  UserEntity,
  UserGoodsEntity,
  ApiV1Error,
  IGoodsModelRepository,
  IMyUserBikeRepository,
  IUserGoodsRepository,
  UserGoodsSearchParams,
} from '@repo/shared-domain'
import {
  GoodsModelId,
  MyUserBikeId,
  UserGoodsId,
  UserId,
  createUserGoodsId,
} from '@repo/shared-types'

type RegisterUserGoodsParams = {
  user: UserEntity
  goodsModelId: GoodsModelId
  userMyBikeId?: MyUserBikeId | null
  purchasedAt?: Date | null
  price?: number | null
  memo?: string | null
}

type UpdateUserGoodsParams = {
  userGoodsId: UserGoodsId
  userId: UserId
  goodsModelId?: GoodsModelId
  userMyBikeId?: MyUserBikeId | null
  purchasedAt?: Date | null
  price?: number | null
  memo?: string | null
}

type DeleteUserGoodsParams = {
  userGoodsId: UserGoodsId
  userId: UserId
}

export class UserGoodsService {
  constructor(
    private userGoodsRepository: IUserGoodsRepository,
    private goodsModelRepository: IGoodsModelRepository,
    private myUserBikeRepository: IMyUserBikeRepository
  ) {}

  public async registerUserGoods(
    params: RegisterUserGoodsParams
  ): Promise<UserGoodsEntity> {
    const goodsModel = await this.goodsModelRepository.findById(
      params.goodsModelId
    )

    if (!goodsModel) {
      throw new ApiV1Error('NOT_FOUND', '指定されたグッズが見つかりません')
    }

    if (params.userMyBikeId) {
      const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
        params.userMyBikeId,
        params.user.id
      )

      if (!myUserBike) {
        throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
      }
    }

    const limits = params.user.limits
    if (limits.goods !== null) {
      const count = await this.userGoodsRepository.countUserGoods(
        params.user.id
      )
      if (limits.isOver('goods', count)) {
        throw new ApiV1Error('INVALID_REQUEST', limits.limitMessage('goods'))
      }
    }

    try {
      const userGoods = new UserGoodsEntity({
        userGoodsId: createUserGoodsId(''),
        userId: params.user.id,
        userMyBikeId: params.userMyBikeId ?? null,
        goodsModelId: goodsModel.id,
        purchasedAt: params.purchasedAt ?? null,
        price: params.price ?? null,
        memo: params.memo ?? null,
        goodsManufacturerId: goodsModel.goodsManufacturerId,
        manufacturerName: goodsModel.manufacturerName,
        modelNumber: goodsModel.modelNumber,
        modelName: goodsModel.name,
        category: goodsModel.category,
        amazonAsin: goodsModel.amazonAsin,
        rakutenItemId: goodsModel.rakutenItemId,
        officialUrl: goodsModel.officialUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      return await this.userGoodsRepository.createUserGoods(userGoods)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  public async getUserGoodsList(
    userId: UserId,
    searchParams: UserGoodsSearchParams
  ): Promise<UserGoodsEntity[]> {
    if (searchParams.myUserBikeId) {
      const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
        searchParams.myUserBikeId,
        userId
      )

      if (!myUserBike) {
        throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
      }
    }

    return await this.userGoodsRepository.findUserGoodsList(
      userId,
      searchParams
    )
  }

  public async getUserGoodsDetail(
    userGoodsId: UserGoodsId,
    userId: UserId
  ): Promise<UserGoodsEntity> {
    const userGoods = await this.userGoodsRepository.findUserGoodsById(
      userGoodsId,
      userId
    )

    if (!userGoods) {
      throw new ApiV1Error('NOT_FOUND', '指定されたグッズが見つかりません')
    }

    return userGoods
  }

  public async updateUserGoods(
    params: UpdateUserGoodsParams
  ): Promise<UserGoodsEntity> {
    // 1. 既存レコードの存在確認・所有権確認
    const existingUserGoods = await this.userGoodsRepository.findUserGoodsById(
      params.userGoodsId,
      params.userId
    )

    if (!existingUserGoods) {
      throw new ApiV1Error('NOT_FOUND', '指定されたグッズが見つかりません')
    }

    // 2. goodsModelId が指定されていれば存在・isActive確認
    const goodsModel = params.goodsModelId
      ? await this.goodsModelRepository.findById(params.goodsModelId)
      : null

    if (params.goodsModelId && !goodsModel) {
      throw new ApiV1Error('NOT_FOUND', '指定されたグッズが見つかりません')
    }

    // 3. userMyBikeId が明示的に指定されて（nullではなく）いれば所有権確認
    if (params.userMyBikeId) {
      const myUserBike = await this.myUserBikeRepository.findMyUserBikeById(
        params.userMyBikeId,
        params.userId
      )

      if (!myUserBike) {
        throw new ApiV1Error('NOT_FOUND', '指定されたバイクが見つかりません')
      }
    }

    // 4. 部分更新のためのマージ処理
    try {
      const updatedUserGoods = new UserGoodsEntity({
        userGoodsId: existingUserGoods.id,
        userId: existingUserGoods.userId,
        userMyBikeId:
          params.userMyBikeId !== undefined
            ? params.userMyBikeId
            : existingUserGoods.userMyBikeId,
        goodsModelId: goodsModel
          ? goodsModel.id
          : existingUserGoods.goodsModelId,
        purchasedAt:
          params.purchasedAt !== undefined
            ? params.purchasedAt
            : existingUserGoods.purchasedAt,
        price:
          params.price !== undefined ? params.price : existingUserGoods.price,
        memo: params.memo !== undefined ? params.memo : existingUserGoods.memo,
        goodsManufacturerId: goodsModel
          ? goodsModel.goodsManufacturerId
          : existingUserGoods.goodsManufacturerId,
        manufacturerName: goodsModel
          ? goodsModel.manufacturerName
          : existingUserGoods.manufacturerName,
        modelNumber: goodsModel
          ? goodsModel.modelNumber
          : existingUserGoods.modelNumber,
        modelName: goodsModel ? goodsModel.name : existingUserGoods.modelName,
        category: goodsModel ? goodsModel.category : existingUserGoods.category,
        amazonAsin: goodsModel
          ? goodsModel.amazonAsin
          : existingUserGoods.amazonAsin,
        rakutenItemId: goodsModel
          ? goodsModel.rakutenItemId
          : existingUserGoods.rakutenItemId,
        officialUrl: goodsModel
          ? goodsModel.officialUrl
          : existingUserGoods.officialUrl,
        createdAt: existingUserGoods.createdAt,
        updatedAt: new Date(),
      })

      // 5. 更新実行
      return await this.userGoodsRepository.updateUserGoods(updatedUserGoods)
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiV1Error('INVALID_REQUEST', error.message)
      }
      throw error
    }
  }

  public async deleteUserGoods(params: DeleteUserGoodsParams): Promise<void> {
    const existingUserGoods = await this.userGoodsRepository.findUserGoodsById(
      params.userGoodsId,
      params.userId
    )

    if (!existingUserGoods) {
      throw new ApiV1Error('NOT_FOUND', '指定されたグッズが見つかりません')
    }

    await this.userGoodsRepository.deleteUserGoods(
      params.userGoodsId,
      params.userId
    )
  }
}
