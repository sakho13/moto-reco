import { FastifyRequest, FastifyReply } from 'fastify'
import { FirebaseAuthRepository } from '../classes/repositories/FirebaseAuthRepository'
import { PrismaAuthProviderRepository } from '../classes/repositories/PrismaAuthProviderRepository'
import { ApiV1Error } from '../classes/common/ApiV1Error'
import { prisma } from '@packages/database'

// Fastify Request型の拡張
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      // 内部User ID（MUser.id）
      userId: string

      // 認証情報
      email?: string
      emailVerified?: boolean
      providerType: string
    }
  }
}

/**
 * 認証ミドルウェア
 * Authorizationヘッダーから Bearer token を検証し、内部User情報を取得
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new ApiV1Error(
        'AUTH_FAILED',
        '認証トークンが提供されていません'
      )
      reply.code(401).send(error.toErrorResponse())
      return
    }

    const token = authHeader.substring(7)

    // Step 1: Firebase Token検証
    const firebaseAuthRepo = new FirebaseAuthRepository()
    const decodedToken = await firebaseAuthRepo.verifyIdToken(token)

    if (!decodedToken) {
      const error = new ApiV1Error('AUTH_FAILED', '認証トークンが無効です')
      reply.code(401).send(error.toErrorResponse())
      return
    }

    const externalId = decodedToken.uid
    const providerType = firebaseAuthRepo.getProviderType(decodedToken)

    // Step 2: MAuthProviderから内部User IDを取得
    const authProviderRepo = new PrismaAuthProviderRepository(prisma)
    const userId = await authProviderRepo.findActiveUserIdByExternalId(
      externalId,
      providerType
    )

    if (!userId) {
      const error = new ApiV1Error(
        'USER_NOT_REGISTERED',
        'ユーザー登録が完了していません'
      )
      reply.code(401).send(error.toErrorResponse())
      return
    }

    request.user = {
      userId,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      providerType: providerType,
    }
  } catch (error) {
    console.error('認証処理中にエラーが発生しました:', error)
    const apiError = new ApiV1Error(
      'SERVER_ERROR',
      '認証処理中にエラーが発生しました'
    )
    reply.code(500).send(apiError.toErrorResponse())
  }
}

/**
 * オプション認証ミドルウェア
 * トークンがあれば検証、なければスキップ
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return // 認証なしで続行
  }

  // 認証がある場合は検証
  return authMiddleware(request, reply)
}
