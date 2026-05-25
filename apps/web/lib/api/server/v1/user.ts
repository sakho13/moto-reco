import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { EmailService, EmailType, ResendEmailRepository } from '@repo/email'
import {
  ApiResponseUserFollowList,
  ApiResponseUserProfile,
  ApiResponsePublicUserPage,
  ApiResponseUserQuit,
  ApiResponseUserRecover,
  ApiResponseUserSearch,
  GuestRegisterRequestSchema,
  SuccessResponse,
  UserAuthRecoverRequestSchema,
  UserAuthQuitRequestSchema,
  UserAuthRegisterRequestSchema,
  UserProfilePatchRequestSchema,
  createUserId,
} from '@repo/shared-types'
import { ApiV1Error } from '../errors/ApiV1Error'
import {
  honoAuthMiddleware,
  honoOptionalAuthMiddleware,
} from '../middlewares/honoAuth'
import { zodValidateJson } from '../middlewares/zodValidation'
import { FirebaseAuthRepository } from '../repositories/FirebaseAuthRepository'
import { PrismaAuthProviderRepository } from '../repositories/PrismaAuthProviderRepository'
import { PrismaHistoryRepository } from '../repositories/PrismaHistoryRepository'
import { PrismaMyUserBikeRepository } from '../repositories/PrismaMyUserBikeRepository'
import { PrismaNotificationRepository } from '../repositories/PrismaNotificationRepository'
import { PrismaUserFollowRepository } from '../repositories/PrismaUserFollowRepository'
import { PrismaUserQuitRepository } from '../repositories/PrismaUserQuitRepository'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { UserFollowService } from '../services/UserFollowService'
import { UserQuitService } from '../services/UserQuitService'
import { UserService } from '../services/UserService'

const user = new Hono()

user.get('/profile', honoAuthMiddleware, async (c) => {
  const { userId } = c.var.user!

  const userRepo = new PrismaUserRepository(prisma)
  const user = await userRepo.findById(userId)

  if (!user) {
    throw new ApiV1Error('USER_NOT_REGISTERED', 'ユーザーが見つかりません')
  }

  return c.json<SuccessResponse<ApiResponseUserProfile>>({
    status: 'success',
    data: {
      userId: user.id,
      name: user.name,
      notificationEmail: user.notificationEmail,
      isProfilePublic: user.isProfilePublic,
      role: user.role as import('@repo/shared-types').UserRole,
    },
    message: 'プロフィール取得成功',
  })
})

/**
 * ユーザープロフィール部分更新エンドポイント
 *
 * @remarks
 * - 認証必須（honoAuthMiddleware）
 * - リクエストボディのバリデーション（zodValidateJson）
 * - nameフィールド: 指定時は1文字以上50文字以下
 * - 少なくとも1フィールドの指定が必須
 */
user.patch(
  '/profile',
  honoAuthMiddleware,
  zodValidateJson(UserProfilePatchRequestSchema),
  async (c) => {
    const { userId, role } = c.var.user!
    const body = c.req.valid('json')

    const userRepo = new PrismaUserRepository(prisma)

    // ユーザーの存在確認
    const user = await userRepo.findById(userId)
    if (!user) {
      throw new ApiV1Error('USER_NOT_REGISTERED', 'ユーザーが見つかりません')
    }

    const prevNotificationEmail = user.notificationEmail

    if (body.name !== undefined) {
      user.name = body.name
    }
    if (body.notificationEmail !== undefined) {
      user.notificationEmail = body.notificationEmail ?? null
    }
    if (body.isProfilePublic !== undefined) {
      if (role === 'GUEST' && body.isProfilePublic === true) {
        throw new ApiV1Error(
          'INVALID_REQUEST',
          'ゲストアカウントはプロフィールを公開できません'
        )
      }
      user.isProfilePublic = body.isProfilePublic
    }

    // プロフィール更新
    const updatedUser = await userRepo.updateUser(user)

    // 通知メールアドレスが新規設定または変更された場合に通知メールを送信
    const newNotificationEmail = updatedUser.notificationEmail
    if (
      newNotificationEmail &&
      newNotificationEmail !== prevNotificationEmail
    ) {
      const emailRepository = new ResendEmailRepository(
        process.env.RESEND_API_KEY,
        process.env.RESEND_FROM_EMAIL
      )
      const emailService = new EmailService(emailRepository)
      emailService
        .sendByType(EmailType.NOTIFICATION_EMAIL_CHANGED, {
          to: newNotificationEmail,
          userName: updatedUser.name,
        })
        .catch((error: unknown) => {
          console.error('通知メールアドレス変更メール送信に失敗しました', error)
        })
    }

    return c.json<SuccessResponse<ApiResponseUserProfile>>({
      status: 'success',
      data: {
        userId: updatedUser.id,
        name: updatedUser.name,
        notificationEmail: updatedUser.notificationEmail,
        isProfilePublic: updatedUser.isProfilePublic,
        role: updatedUser.role as import('@repo/shared-types').UserRole,
      },
      message: 'プロフィール更新成功',
    })
  }
)

user.get('/:userId/page', honoOptionalAuthMiddleware, async (c) => {
  const userId = c.req.param('userId')
  const requesterId = c.var.user?.userId
  const targetUserId = createUserId(userId)

  const userRepo = new PrismaUserRepository(prisma)
  const followRepo = new PrismaUserFollowRepository(prisma)
  const myUserBikeRepo = new PrismaMyUserBikeRepository(prisma)
  const historyRepo = new PrismaHistoryRepository(prisma)
  const targetUser = await userRepo.findById(targetUserId)

  if (!targetUser || !targetUser.isProfilePublic) {
    throw new ApiV1Error('NOT_FOUND', '公開プロフィールが見つかりません')
  }

  const [bikes, histories, followerCount, followingCount, isFollowing] =
    await Promise.all([
      myUserBikeRepo.findPublicBikesByUserId(targetUserId, 8),
      historyRepo.findPublicHistoriesByUserId(targetUserId, 30),
      followRepo.countFollowers(targetUserId),
      followRepo.countFollowing(targetUserId),
      requesterId
        ? followRepo.isFollowing(requesterId, targetUserId)
        : Promise.resolve(false),
    ])

  return c.json<SuccessResponse<ApiResponsePublicUserPage>>({
    status: 'success',
    data: {
      userId: targetUser.id,
      name: targetUser.name,
      followerCount,
      followingCount,
      isFollowing,
      bikes: bikes.map((bike) => ({
        myUserBikeId: bike.myUserBikeId,
        manufacturerName: bike.manufacturerName,
        modelName: bike.modelName,
        nickname: bike.nickname,
        displacement: bike.displacement,
        totalMileage: bike.totalMileage,
        ownedAt: bike.ownedAt.toISOString(),
        updatedAt: bike.updatedAt.toISOString(),
      })),
      histories: histories
        .map((item) => {
          const bikeName =
            item.userMyBike?.nickname ??
            item.userMyBike?.userBike.bike?.modelName ??
            'バイク'
          if (item.type === 'FUEL_LOG' && item.fuelLog) {
            return {
              bikeId: item.userMyBikeId ?? '',
              bikeName,
              type: 'FUEL_LOG' as const,
              occurredAt: item.occurredAt.toISOString(),
              fuelLog: {
                fuelLogId: item.fuelLog.id,
                refueledAt: item.fuelLog.refueledAt.toISOString(),
                mileage: item.fuelLog.mileage,
                previousMileage: item.fuelLog.previousMileage,
                amount: item.fuelLog.amount,
                totalPrice: item.fuelLog.price,
                memo: item.fuelLog.memo,
                fuelEfficiency: null,
                pricePerLiter: null,
                touringId: item.fuelLog.touringId,
                touringTitle: null,
              },
            }
          }
          if (item.type === 'TOURING' && item.touring) {
            return {
              bikeId: item.userMyBikeId ?? '',
              bikeName,
              type: 'TOURING' as const,
              occurredAt: item.occurredAt.toISOString(),
              touring: {
                touringId: item.touring.id,
                title: item.touring.title,
                startDate: item.touring.startDate.toISOString(),
                endDate: item.touring.endDate.toISOString(),
                startMileage: item.touring.startMileage,
                endMileage: item.touring.endMileage,
                startLatitude: null,
                startLongitude: null,
                endLatitude: null,
                endLongitude: null,
                status: item.touring.status,
                fuelLogIds: [],
              },
            }
          }
          return null
        })
        .filter((v): v is NonNullable<typeof v> => v !== null),
    },
    message: '公開プロフィール取得成功',
  })
})

user.post('/:userId/follow', honoAuthMiddleware, async (c) => {
  const { userId: followerId, role } = c.var.user!
  const followingId = createUserId(c.req.param('userId'))

  const userRepo = new PrismaUserRepository(prisma)
  const followRepo = new PrismaUserFollowRepository(prisma)
  const notifRepo = new PrismaNotificationRepository(prisma)
  const service = new UserFollowService(userRepo, followRepo, notifRepo)
  await service.followUser(followerId, followingId, role)

  return c.json<SuccessResponse<Record<string, never>>>({
    status: 'success',
    data: {},
    message: 'フォローしました',
  })
})

user.delete('/:userId/follow', honoAuthMiddleware, async (c) => {
  const { userId: followerId } = c.var.user!
  const followingId = createUserId(c.req.param('userId'))

  const userRepo = new PrismaUserRepository(prisma)
  const followRepo = new PrismaUserFollowRepository(prisma)
  const service = new UserFollowService(
    userRepo,
    followRepo,
    new PrismaNotificationRepository(prisma)
  )
  await service.unfollowUser(followerId, followingId)

  return c.json<SuccessResponse<Record<string, never>>>({
    status: 'success',
    data: {},
    message: 'フォロー解除しました',
  })
})

user.get('/:userId/followers', honoAuthMiddleware, async (c) => {
  const userId = createUserId(c.req.param('userId'))
  const page = Number(c.req.query('page') ?? '1')

  const userRepo = new PrismaUserRepository(prisma)
  const targetUser = await userRepo.findById(userId)
  if (!targetUser || !targetUser.isProfilePublic) {
    throw new ApiV1Error('NOT_FOUND', '公開プロフィールが見つかりません')
  }

  const followRepo = new PrismaUserFollowRepository(prisma)
  const service = new UserFollowService(
    userRepo,
    followRepo,
    new PrismaNotificationRepository(prisma)
  )
  const result = await service.getFollowers(userId, page)

  return c.json<SuccessResponse<ApiResponseUserFollowList>>({
    status: 'success',
    data: result,
    message: 'フォロワー一覧取得成功',
  })
})

user.get('/:userId/following', honoAuthMiddleware, async (c) => {
  const userId = createUserId(c.req.param('userId'))
  const page = Number(c.req.query('page') ?? '1')

  const userRepo = new PrismaUserRepository(prisma)
  const targetUser = await userRepo.findById(userId)
  if (!targetUser || !targetUser.isProfilePublic) {
    throw new ApiV1Error('NOT_FOUND', '公開プロフィールが見つかりません')
  }

  const followRepo = new PrismaUserFollowRepository(prisma)
  const service = new UserFollowService(
    userRepo,
    followRepo,
    new PrismaNotificationRepository(prisma)
  )
  const result = await service.getFollowing(userId, page)

  return c.json<SuccessResponse<ApiResponseUserFollowList>>({
    status: 'success',
    data: result,
    message: 'フォロー中一覧取得成功',
  })
})

user.get('/search', honoAuthMiddleware, async (c) => {
  const { userId: requesterId } = c.var.user!
  const query = c.req.query('q') ?? ''
  const page = Number(c.req.query('page') ?? '1')

  if (query.trim().length === 0) {
    return c.json<SuccessResponse<ApiResponseUserSearch>>({
      status: 'success',
      data: { users: [], total: 0, page },
      message: 'ユーザー検索成功',
    })
  }

  const userRepo = new PrismaUserRepository(prisma)
  const followRepo = new PrismaUserFollowRepository(prisma)
  const service = new UserFollowService(
    userRepo,
    followRepo,
    new PrismaNotificationRepository(prisma)
  )
  const result = await service.searchUsers(query.trim(), requesterId, page)

  return c.json<SuccessResponse<ApiResponseUserSearch>>({
    status: 'success',
    data: result,
    message: 'ユーザー検索成功',
  })
})

/**
 * ユーザー認証登録エンドポイント
 *
 * Firebase IDトークンによる認証後、ユーザー情報を登録します。
 * 既に同じ認証プロバイダーでユーザーが存在する場合は、既存ユーザー情報を返却します（冪等性）。
 *
 * @route POST /api/v1/user/auth/register
 * @param {UserAuthRegisterRequest} body.name - ユーザー名（1-50文字）
 * @returns {201} ユーザー登録成功
 * @throws {400} バリデーションエラー
 * @throws {401} 認証失敗
 * @throws {500} サーバーエラー
 */
user.post(
  '/auth/register',
  zodValidateJson(UserAuthRegisterRequestSchema),
  async (c) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが提供されていません')
    }

    const token = authHeader.substring('Bearer '.length)
    const firebaseAuthRepo = new FirebaseAuthRepository()
    const authProvider = await firebaseAuthRepo.authorize(token)

    if (!authProvider) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが無効です')
    }

    if (authProvider.provider === 'FIREBASE_ANONYMOUS') {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        '匿名認証トークンでは通常登録できません'
      )
    }

    const body = c.req.valid('json')

    const { user, status } = await prisma.$transaction(async (t) => {
      const userRepo = new PrismaUserRepository(t)
      const service = new UserService(userRepo)

      const user = await service.createUser(authProvider, {
        name: body.name,
      })
      return user
    })

    if (status === 'CREATED' && user.notificationEmail) {
      const emailRepository = new ResendEmailRepository(
        process.env.RESEND_API_KEY,
        process.env.RESEND_FROM_EMAIL
      )
      const emailService = new EmailService(emailRepository)

      emailService
        .sendByType(EmailType.WELCOME, {
          to: user.notificationEmail,
          userName: user.name,
        })
        .catch((error: unknown) => {
          console.error('Welcomeメール送信に失敗しました', error)
        })
    }

    return c.json<SuccessResponse<ApiResponseUserProfile>>(
      {
        status: 'success',
        data: {
          userId: user.id,
          name: user.name,
          notificationEmail: user.notificationEmail,
          isProfilePublic: user.isProfilePublic,
          role: user.role as import('@repo/shared-types').UserRole,
        },
        message: 'ユーザー登録成功',
      },
      201
    )
  }
)

/**
 * ユーザー退会エンドポイント
 *
 * @remarks
 * - 認証必須（honoAuthMiddleware）
 * - 退会理由の入力が必須
 * - 退会後に復帰コードを返却
 */
user.post(
  '/auth/quit',
  honoAuthMiddleware,
  zodValidateJson(UserAuthQuitRequestSchema),
  async (c) => {
    const { userId } = c.var.user!
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const userRepo = new PrismaUserRepository(t)
      const authProviderRepo = new PrismaAuthProviderRepository(t)
      const userQuitRepo = new PrismaUserQuitRepository(t)
      const service = new UserQuitService(
        userRepo,
        authProviderRepo,
        userQuitRepo
      )

      return service.quitUser({
        userId,
        quitReason: body.quitReason,
      })
    })

    return c.json<SuccessResponse<ApiResponseUserQuit>>({
      status: 'success',
      data: {
        recoveryCode: result.recoveryCode,
      },
      message: '退会処理が完了しました',
    })
  }
)

/**
 * ユーザー復帰エンドポイント
 *
 * @remarks
 * - Firebase認証トークン必須
 * - 復帰コードの入力が必須
 */
user.post(
  '/auth/recover',
  zodValidateJson(UserAuthRecoverRequestSchema),
  async (c) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが提供されていません')
    }

    const token = authHeader.substring('Bearer '.length)
    const firebaseAuthRepo = new FirebaseAuthRepository()
    const authProvider = await firebaseAuthRepo.authorize(token)

    if (!authProvider) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが無効です')
    }

    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const userRepo = new PrismaUserRepository(t)
      const authProviderRepo = new PrismaAuthProviderRepository(t)
      const userQuitRepo = new PrismaUserQuitRepository(t)
      const service = new UserQuitService(
        userRepo,
        authProviderRepo,
        userQuitRepo
      )

      return service.recoverUser({
        externalId: authProvider.externalId,
        providerType: authProvider.provider,
        recoveryCode: body.recoveryCode,
      })
    })

    return c.json<SuccessResponse<ApiResponseUserRecover>>({
      status: 'success',
      data: {
        userId: result.userId,
      },
      message: '復帰処理が完了しました',
    })
  }
)

/**
 * ゲストユーザー登録エンドポイント
 *
 * Firebase匿名認証トークンを受け取り、ゲストユーザーを作成します。
 * 既に同じ匿名UIDでゲストユーザーが存在する場合は既存ユーザーを返します（冪等性）。
 *
 * @route POST /api/v1/user/auth/guest/register
 * @param {GuestRegisterRequest} body.name - ユーザー名（省略可）
 * @returns {201} ゲストユーザー登録成功
 * @throws {400} バリデーションエラー
 * @throws {401} 認証失敗
 * @throws {500} サーバーエラー
 */
user.post(
  '/auth/guest/register',
  zodValidateJson(GuestRegisterRequestSchema),
  async (c) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが提供されていません')
    }

    const token = authHeader.substring('Bearer '.length)
    const firebaseAuthRepo = new FirebaseAuthRepository()
    const authProvider = await firebaseAuthRepo.authorize(token)

    if (!authProvider) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが無効です')
    }

    // 匿名認証トークンのみ受け付ける
    if (authProvider.provider !== 'FIREBASE_ANONYMOUS') {
      throw new ApiV1Error(
        'INVALID_REQUEST',
        'ゲスト登録には匿名認証トークンが必要です'
      )
    }

    const body = c.req.valid('json')

    const guestUser = await prisma.$transaction(async (t) => {
      const userRepo = new PrismaUserRepository(t)
      const service = new UserService(userRepo)
      return service.createGuestUser(authProvider, { name: body.name })
    })

    return c.json<SuccessResponse<ApiResponseUserProfile>>(
      {
        status: 'success',
        data: {
          userId: guestUser.id,
          name: guestUser.name,
          notificationEmail: guestUser.notificationEmail,
          isProfilePublic: guestUser.isProfilePublic,
          role: guestUser.role as import('@repo/shared-types').UserRole,
        },
        message: 'ゲストユーザー登録成功',
      },
      201
    )
  }
)

export default user
