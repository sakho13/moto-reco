import { FastifyRequest } from 'fastify'
import { SuccessResponse, ErrorResponse } from '@packages/shared-types'
import { ApiV1Error } from './ApiV1Error'
import { FirebaseAuthRepository } from '../repositories/FirebaseAuthRepository'
import { AuthProviderEntity } from '../entities/AuthProviderEntity'

export class ApiV1Wrapper {
  constructor() {}

  public async execute<T>(
    proc: () => Promise<{ result: T; message?: string }>
  ): Promise<SuccessResponse<T> | ErrorResponse<unknown>> {
    try {
      const { result, message } = await proc()
      return {
        status: 'success',
        data: result,
        message,
      }
    } catch (error) {
      if (error instanceof ApiV1Error) {
        return error.toErrorResponse()
      }
      return {
        status: 'error',
        errorCode: 'SERVER_ERROR',
        message: 'サーバーエラーが発生しました。',
      }
    }
  }

  public async authorize(req: FastifyRequest): Promise<AuthProviderEntity> {
    const authorization = req.headers.authorization
    if (!authorization) {
      throw new ApiV1Error('INVALID_REQUEST', '未認証エラー')
    }

    const token = authorization.replace('Bearer ', '')
    if (!token) {
      throw new ApiV1Error('INVALID_REQUEST', '未認証エラー')
    }

    const firebaseAuthRepository = new FirebaseAuthRepository()
    const authResult = await firebaseAuthRepository.authorize(token)
    if (!authResult) {
      throw new ApiV1Error('AUTH_FAILED', '認証に失敗しました。')
    }
    return authResult
  }
}
