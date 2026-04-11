import { Context, Next } from 'hono'
import { prisma } from '@repo/database'
import { createUserId } from '@repo/shared-types'
import { ApiAdminError } from '../errors/ApiAdminError'
import { FirebaseAuthRepository } from '../repositories/FirebaseAuthRepository'
import { PrismaAuthProviderRepository } from '../repositories/PrismaAuthProviderRepository'
import { PrismaUserRepository } from '../repositories/PrismaUserRepository'
import { HonoVariables } from '../types/hono'

/**
 * 管理者専用認証ミドルウェア
 * 1. Firebase IDトークンを検証
 * 2. 内部User IDを取得
 * 3. MUser.role === 'ADMIN' を確認
 */
export async function honoAdminAuthMiddleware(
  c: Context<{ Variables: HonoVariables }>,
  next: Next
) {
  try {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiAdminError('AUTH_FAILED', '認証トークンが提供されていません')
    }

    const token = authHeader.substring('Bearer '.length)

    // Step 1: Firebase Token検証と認証情報取得
    const firebaseAuthRepo = new FirebaseAuthRepository()
    const authProvider = await firebaseAuthRepo.authorize(token)

    if (!authProvider) {
      throw new ApiAdminError('AUTH_FAILED', '認証トークンが無効です')
    }

    // Step 2: MAuthProviderから内部User IDを取得
    const authProviderRepo = new PrismaAuthProviderRepository(prisma)
    const userId = await authProviderRepo.findActiveUserIdByExternalId(
      authProvider.externalId,
      authProvider.provider
    )

    if (!userId) {
      throw new ApiAdminError(
        'USER_NOT_REGISTERED',
        'ユーザー登録が完了していません'
      )
    }

    // Step 3: ADMINロールを確認
    const userRepo = new PrismaUserRepository(prisma)
    const user = await userRepo.findById(createUserId(userId))

    if (!user || user.role !== 'ADMIN') {
      throw new ApiAdminError('ADMIN_FORBIDDEN', '管理者権限が必要です')
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
    if (error instanceof ApiAdminError) {
      throw error
    }

    console.error('認証処理中にエラーが発生しました:', error)
    throw new ApiAdminError('SERVER_ERROR', '認証処理中にエラーが発生しました')
  }
}
