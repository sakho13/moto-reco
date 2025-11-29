import { Context, Next } from 'hono'
import { FirebaseAuthRepository } from '../classes/repositories/FirebaseAuthRepository'
import { PrismaAuthProviderRepository } from '../classes/repositories/PrismaAuthProviderRepository'
import { ApiV1Error } from '../classes/common/ApiV1Error'
import { prisma } from '@packages/database'
import { HonoVariables } from '../types/hono'
import { createUserId } from '@shared-types/index'

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

    // Step 2: MAuthProviderから内部User IDを取得
    const authProviderRepo = new PrismaAuthProviderRepository(prisma)
    const userId = await authProviderRepo.findActiveUserIdByExternalId(
      authProvider.externalId,
      authProvider.provider
    )

    if (!userId) {
      throw new ApiV1Error(
        'USER_NOT_REGISTERED',
        'ユーザー登録が完了していません'
      )
    }

    // Honoのコンテキストにユーザー情報を設定
    c.set('user', {
      userId: createUserId(userId),
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
