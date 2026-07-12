import { Context, Next } from 'hono'
import { prisma } from '@repo/database'
import { createUserId } from '@repo/shared-types'
import { getCurrentDate } from '@repo/shared-utils'
import { GUEST_ACCOUNT_LIMITS } from '../../../statics'
import { UserEntity } from '../entities/UserEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { FirebaseAuthRepository } from '../repositories/FirebaseAuthRepository'
import { PrismaAuthProviderRepository } from '../repositories/PrismaAuthProviderRepository'
import { HonoVariables } from '../types/hono'

/**
 * Hono用認証ミドルウェア
 * Authorizationヘッダーから Bearer token を検証し、内部User情報を取得
 */
export async function honoAuthMiddleware(
  c: Context<{ Variables: HonoVariables }>,
  next: Next
) {
  try {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが提供されていません')
    }

    const token = authHeader.substring('Bearer '.length)

    // Step 1: Firebase Token検証と認証情報取得
    const firebaseAuthRepo = new FirebaseAuthRepository()
    const authProvider = await firebaseAuthRepo.authorize(token)

    if (!authProvider) {
      throw new ApiV1Error('AUTH_FAILED', '認証トークンが無効です')
    }

    // Step 2: MAuthProviderから内部User情報（ID・ロール・作成日時）を取得
    const authProviderRepo = new PrismaAuthProviderRepository(prisma)
    const userInfo = await authProviderRepo.findActiveUserInfoByExternalId(
      authProvider.externalId,
      authProvider.provider
    )

    if (!userInfo) {
      throw new ApiV1Error(
        'USER_NOT_REGISTERED',
        'ユーザー登録が完了していません'
      )
    }

    // Step 3: ゲストアカウントの有効期限チェック（登録から7日）
    if (userInfo.role === 'GUEST') {
      const expiresAt = new Date(
        userInfo.createdAt.getTime() + GUEST_ACCOUNT_LIMITS.TTL_MS
      )
      if (getCurrentDate() > expiresAt) {
        throw new ApiV1Error(
          'GUEST_EXPIRED',
          'ゲストアカウントの有効期限が切れました。本登録を行ってください。'
        )
      }
    }

    // Honoのコンテキストにユーザー情報を設定
    const userEntity = new UserEntity(
      {
        id: createUserId(userInfo.userId),
        name: userInfo.name,
        role: userInfo.role,
        status: userInfo.status,
        notificationEmail: userInfo.notificationEmail,
        isProfilePublic: userInfo.isProfilePublic,
      },
      userInfo.plan
    )
    c.set('user', {
      userEntity,
      email: authProvider.metadata?.email as string | undefined,
      emailVerified: authProvider.metadata?.emailVerified as
        | boolean
        | undefined,
      providerType: authProvider.provider,
    })

    await next()
  } catch (error) {
    // ApiV1Errorはグローバルエラーハンドラで処理される
    if (error instanceof ApiV1Error) {
      throw error
    }

    console.error('認証処理中にエラーが発生しました:', error)
    throw new ApiV1Error('SERVER_ERROR', '認証処理中にエラーが発生しました')
  }
}

/**
 * Hono用オプション認証ミドルウェア
 * トークンがあれば検証、なければスキップ
 */
export async function honoOptionalAuthMiddleware(
  c: Context<{ Variables: HonoVariables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 認証なしで続行
    await next()
    return
  }

  // 認証がある場合は検証
  return honoAuthMiddleware(c, next)
}
