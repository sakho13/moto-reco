import { Hono } from 'hono'
import { prisma } from '@repo/database'
import { EmailService, EmailType, ResendEmailRepository } from '@repo/email'
import { ApiV1Error } from '@repo/shared-domain'
import {
  ApiResponseNotificationEmailVerify,
  ApiResponseUserProfile,
  ApiResponseUserPlanHistory,
  ApiResponseUserAuthProviderSwitch,
  ApiResponseUserQuit,
  ApiResponseUserRecover,
  ChangePlanRequestSchema,
  GuestRegisterRequestSchema,
  NotificationEmailVerifyRequestSchema,
  SuccessResponse,
  UserAuthProviderSwitchRequestSchema,
  UserAuthRecoverRequestSchema,
  UserAuthQuitRequestSchema,
  UserAuthRegisterRequestSchema,
  UserProfilePatchRequestSchema,
  createUserId,
} from '@repo/shared-types'
import { honoAuthMiddleware } from '../middlewares/honoAuth'
import { zodValidateJson } from '../middlewares/zodValidation'
import { FirebaseAuthRepository } from '../repositories/FirebaseAuthRepository'
import { PrismaAuthProviderRepository } from '../repositories/PrismaAuthProviderRepository'
import { PrismaNotificationEmailVerificationRepository } from '../repositories/PrismaNotificationEmailVerificationRepository'
import { PrismaUserPlanHistoryRepository } from '../repositories/PrismaUserPlanHistoryRepository'
import { PrismaUserQuitRepository } from '../repositories/PrismaUserQuitRepository'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { AuthProviderSwitchService } from '../services/AuthProviderSwitchService'
import { NotificationEmailVerificationService } from '../services/NotificationEmailVerificationService'
import { UserPlanService } from '../services/UserPlanService'
import { UserQuitService } from '../services/UserQuitService'
import { UserService } from '../services/UserService'

const user = new Hono()

user.get('/profile', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!

  const userRepo = new PrismaUserRepository(prisma)
  const user = await userRepo.findById(userEntity.id)

  if (!user) {
    throw new ApiV1Error('USER_NOT_REGISTERED', 'ユーザーが見つかりません')
  }

  const verificationService = new NotificationEmailVerificationService(
    new PrismaNotificationEmailVerificationRepository(prisma),
    userRepo
  )
  const pendingNotificationEmail = await verificationService.getPendingEmail(
    user.id
  )

  return c.json<SuccessResponse<ApiResponseUserProfile>>({
    status: 'success',
    data: {
      userId: user.id,
      name: user.name,
      notificationEmail: user.notificationEmail,
      pendingNotificationEmail,
      role: user.role as import('@repo/shared-types').UserRole,
      plan: user.plan,
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
 * - notificationEmailフィールド: 新しいアドレスは即時反映せず、確認メールを送って所有確認後に反映する。
 *   `null` の指定（解除）は即時反映する
 * - 少なくとも1フィールドの指定が必須
 */
user.patch(
  '/profile',
  honoAuthMiddleware,
  zodValidateJson(UserProfilePatchRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!
    const body = c.req.valid('json')

    const userRepo = new PrismaUserRepository(prisma)
    const verificationService = new NotificationEmailVerificationService(
      new PrismaNotificationEmailVerificationRepository(prisma),
      userRepo
    )

    // ユーザーの存在確認
    const user = await userRepo.findById(userEntity.id)
    if (!user) {
      throw new ApiV1Error('USER_NOT_REGISTERED', 'ユーザーが見つかりません')
    }

    // 通知メールアドレスの変更依頼（所有確認が必要なもの）
    let verificationRequest: { token: string; email: string } | null = null
    if (body.notificationEmail !== undefined) {
      const requestedEmail = body.notificationEmail ?? null

      if (requestedEmail === null) {
        // 解除は所有確認不要のため即時反映する
        user.notificationEmail = null
        await verificationService.cancelPending(user.id)
      } else if (requestedEmail === user.notificationEmail) {
        // 現在のアドレスのままなら確認待ちの依頼だけ取り消す
        await verificationService.cancelPending(user.id)
      } else {
        if (userEntity.role === 'GUEST') {
          throw new ApiV1Error(
            'FORBIDDEN',
            'ゲストアカウントは通知メールアドレスを設定できません'
          )
        }
        // 送信レート制限を超えた場合はここで例外となり、名前の更新も行わない。
        // 並列リクエストで上限をすり抜けないよう、ユーザー単位のロックを取るトランザクション内で発行する
        verificationRequest = await prisma.$transaction(async (t) =>
          new NotificationEmailVerificationService(
            new PrismaNotificationEmailVerificationRepository(t),
            new PrismaUserRepository(t)
          ).requestChange(user.id, requestedEmail)
        )
      }
    }

    if (body.name !== undefined) {
      user.name = body.name
    }
    // プロフィール更新
    const updatedUser = await userRepo.updateUser(user)

    // 新しいアドレスへ確認メールを送信する（表示名は含めない）
    if (verificationRequest) {
      const emailRepository = new ResendEmailRepository(
        process.env.RESEND_API_KEY,
        process.env.RESEND_FROM_EMAIL
      )
      const emailService = new EmailService(emailRepository)
      emailService
        .sendByType(EmailType.NOTIFICATION_EMAIL_VERIFICATION, {
          to: verificationRequest.email,
          token: verificationRequest.token,
        })
        .catch((error: unknown) => {
          console.error('通知メールアドレス確認メール送信に失敗しました', error)
        })
    }

    const pendingNotificationEmail = await verificationService.getPendingEmail(
      updatedUser.id
    )

    return c.json<SuccessResponse<ApiResponseUserProfile>>({
      status: 'success',
      data: {
        userId: updatedUser.id,
        name: updatedUser.name,
        notificationEmail: updatedUser.notificationEmail,
        pendingNotificationEmail,
        role: updatedUser.role as import('@repo/shared-types').UserRole,
        plan: updatedUser.plan,
      },
      message: verificationRequest
        ? '確認メールを送信しました。メール内のリンクから確認すると通知メールアドレスが変更されます'
        : 'プロフィール更新成功',
    })
  }
)

/**
 * 通知メールアドレス所有確認エンドポイント
 *
 * @remarks
 * - 認証不要（完全公開エンドポイント）。確認メールに記載されたトークンのみで完結する
 * - トークンをSHA-256ハッシュ化して照合し、未確認・未無効化・有効期限内であれば通知メールアドレスを確定する
 * - 成功時はワンタイム化する
 */
user.post(
  '/notification-email/verify',
  zodValidateJson(NotificationEmailVerifyRequestSchema),
  async (c) => {
    const body = c.req.valid('json')

    const result = await prisma.$transaction(async (t) => {
      const service = new NotificationEmailVerificationService(
        new PrismaNotificationEmailVerificationRepository(t),
        new PrismaUserRepository(t)
      )
      return service.verify(body.token)
    })

    return c.json<SuccessResponse<ApiResponseNotificationEmailVerify>>({
      status: 'success',
      data: { notificationEmail: result.notificationEmail },
      message: '通知メールアドレスを確認しました',
    })
  }
)

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
          pendingNotificationEmail: null,
          role: user.role as import('@repo/shared-types').UserRole,
          plan: user.plan,
        },
        message: 'ユーザー登録成功',
      },
      201
    )
  }
)

/**
 * 認証方式切り替えエンドポイント
 *
 * @remarks
 * - 認証必須（honoAuthMiddleware）
 * - 切り替え先の認証方式が Firebase アカウントに紐付いている必要がある
 * - 切り替え先以外の認証方式は Firebase アカウントから外す
 * - GUESTロールは切り替え不可
 *
 * @route PUT /api/v1/user/auth/provider
 */
user.put(
  '/auth/provider',
  honoAuthMiddleware,
  zodValidateJson(UserAuthProviderSwitchRequestSchema),
  async (c) => {
    const { userEntity, externalId } = c.var.user!
    const body = c.req.valid('json')

    const service = new AuthProviderSwitchService(
      new PrismaAuthProviderRepository(prisma),
      new FirebaseAuthRepository()
    )
    const result = await service.switchProvider(
      userEntity,
      externalId,
      body.providerType
    )

    return c.json<SuccessResponse<ApiResponseUserAuthProviderSwitch>>({
      status: 'success',
      data: result,
      message: result.switched
        ? '認証方式を切り替えました'
        : '認証方式は変更されていません',
    })
  }
)

/**
 * ユーザー退会エンドポイント
 *
 * @remarks
 * - 認証必須（honoAuthMiddleware）
 * - 退会理由の入力が必須
 * - GUEST/ADMINロールは退会不可
 * - 復帰用URL（トークン付き）をメールで送信する。復帰コード等はレスポンスに含めない
 */
user.post(
  '/auth/quit',
  honoAuthMiddleware,
  zodValidateJson(UserAuthQuitRequestSchema),
  async (c) => {
    const { userEntity, email } = c.var.user!
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
        userId: userEntity.id,
        quitReason: body.quitReason,
      })
    })

    if (email) {
      const emailRepository = new ResendEmailRepository(
        process.env.RESEND_API_KEY,
        process.env.RESEND_FROM_EMAIL
      )
      const emailService = new EmailService(emailRepository)

      emailService
        .sendByType(EmailType.USER_QUIT, {
          to: email,
          userName: userEntity.name,
          recoveryToken: result.recoveryToken,
        })
        .catch((error: unknown) => {
          console.error('退会案内メール送信に失敗しました', error)
        })
    }

    return c.json<SuccessResponse<ApiResponseUserQuit>>({
      status: 'success',
      data: { recoveryToken: result.recoveryToken },
      message: '退会処理が完了しました。復帰用のご案内メールを送信しました。',
    })
  }
)

/**
 * ユーザー復帰エンドポイント
 *
 * @remarks
 * - 認証不要（完全公開エンドポイント）。メールに記載された復帰トークンのみで完結する
 * - トークンをSHA-256ハッシュ化して照合し、猶予期間(purgeAt)を超過していないか確認する
 * - 成功時はワンタイム化（RECOVERED）する
 */
user.post(
  '/auth/recover',
  zodValidateJson(UserAuthRecoverRequestSchema),
  async (c) => {
    const body = c.req.valid('json')

    await prisma.$transaction(async (t) => {
      const userRepo = new PrismaUserRepository(t)
      const authProviderRepo = new PrismaAuthProviderRepository(t)
      const userQuitRepo = new PrismaUserQuitRepository(t)
      const service = new UserQuitService(
        userRepo,
        authProviderRepo,
        userQuitRepo
      )

      return service.recoverUser({
        token: body.token,
      })
    })

    return c.json<SuccessResponse<ApiResponseUserRecover>>({
      status: 'success',
      data: {},
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
          pendingNotificationEmail: null,
          role: guestUser.role as import('@repo/shared-types').UserRole,
          plan: guestUser.plan,
        },
        message: 'ゲストユーザー登録成功',
      },
      201
    )
  }
)

/**
 * 自分のプラン変更履歴を取得するエンドポイント
 *
 * @remarks
 * - 認証必須
 * - role !== 'USER' の場合は空配列を返す
 */
user.get('/plan/histories', honoAuthMiddleware, async (c) => {
  const { userEntity } = c.var.user!

  const userRepo = new PrismaUserRepository(prisma)
  const planHistoryRepo = new PrismaUserPlanHistoryRepository(prisma)
  const service = new UserPlanService(userRepo, planHistoryRepo)

  const histories = await service.getPlanHistories(userEntity.id)

  return c.json<SuccessResponse<ApiResponseUserPlanHistory>>({
    status: 'success',
    data: histories.map((h) => ({
      id: h.id,
      plan: h.plan,
      changedAt: h.changedAt.toISOString(),
      changedByName: '',
      reason: h.reason,
    })),
    message: 'プラン変更履歴取得成功',
  })
})

/**
 * ユーザーのプランを変更するエンドポイント（管理者専用）
 *
 * @remarks
 * - 認証必須・ADMIN ロール限定
 * - 対象ユーザーの role が USER 以外の場合は 403
 */
user.patch(
  '/admin/plan',
  honoAuthMiddleware,
  zodValidateJson(ChangePlanRequestSchema),
  async (c) => {
    const { userEntity } = c.var.user!

    if (userEntity.role !== 'ADMIN') {
      throw new ApiV1Error('FORBIDDEN', 'この操作は管理者のみ実行できます')
    }

    const body = c.req.valid('json')

    const userRepo = new PrismaUserRepository(prisma)
    const planHistoryRepo = new PrismaUserPlanHistoryRepository(prisma)
    const service = new UserPlanService(userRepo, planHistoryRepo)

    await service.changePlan(
      createUserId(body.targetUserId),
      body.plan,
      userEntity.id,
      body.reason ?? null
    )

    return c.json<SuccessResponse<Record<string, never>>>({
      status: 'success',
      data: {},
      message: 'プランを変更しました',
    })
  }
)

export default user
