import {
  createUserId,
  createUserQuitId,
  type ProviderType,
  type UserId,
  type UserQuitStatus,
} from '@repo/shared-types'
import { generateRandNumberStr } from '@repo/shared-utils'
import { getCurrentDate } from '../../../utils/dateUtils'
import { UserQuitEntity } from '../entities/UserQuitEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IUserQuitRepository } from '../interfaces/IUserQuitRepository'
import { IUserRepository } from '../interfaces/IUserRepository'
import { PrismaAuthProviderRepository } from '../repositories/PrismaAuthProviderRepository'

type QuitUserParams = {
  userId: UserId
  quitReason: string
}

type RecoverUserParams = {
  externalId: string
  providerType: ProviderType
  recoveryCode: string
}

export class UserQuitService {
  constructor(
    private userRepository: IUserRepository,
    private authProviderRepository: PrismaAuthProviderRepository,
    private userQuitRepository: IUserQuitRepository
  ) {}

  public async quitUser(params: QuitUserParams): Promise<{
    recoveryCode: string
  }> {
    const user = await this.userRepository.findById(params.userId)
    if (!user) {
      throw new ApiV1Error('USER_NOT_REGISTERED', 'ユーザーが見つかりません')
    }

    const recoveryCode = generateRandNumberStr(5)
    const quitAt = getCurrentDate()
    const status: UserQuitStatus = 'QUIT'

    await this.userQuitRepository.create(
      new UserQuitEntity({
        id: createUserQuitId(''),
        userId: params.userId,
        quitReason: params.quitReason,
        quitAt,
        recoveryCode,
        status,
      })
    )

    await this.userRepository.deactivateUser(params.userId)
    await this.authProviderRepository.deactivateByUserId(params.userId)

    return { recoveryCode }
  }

  public async recoverUser(params: RecoverUserParams): Promise<{
    userId: UserId
  }> {
    const userIdValue =
      await this.authProviderRepository.findUserIdByExternalId(
        params.externalId,
        params.providerType
      )

    if (!userIdValue) {
      throw new ApiV1Error(
        'USER_NOT_REGISTERED',
        'ユーザー登録が完了していません'
      )
    }

    const userId = createUserId(userIdValue)
    const user = await this.userRepository.findByIdIncludingInactive(userId)
    if (!user) {
      throw new ApiV1Error('USER_NOT_REGISTERED', 'ユーザーが見つかりません')
    }

    if (user.status === 'ACTIVE') {
      throw new ApiV1Error('INVALID_REQUEST', 'ユーザーは既に有効です')
    }

    if (user.status !== 'INACTIVE') {
      throw new ApiV1Error('INVALID_REQUEST', '復帰できない状態です')
    }

    const userQuit = await this.userQuitRepository.findByUserId(userId)
    if (!userQuit) {
      throw new ApiV1Error('NOT_FOUND', '退会情報が見つかりません')
    }

    if (userQuit.status === 'RECOVERED') {
      throw new ApiV1Error('INVALID_REQUEST', '既に復帰済みです')
    }

    if (userQuit.recoveryCode !== params.recoveryCode) {
      throw new ApiV1Error('INVALID_REQUEST', '復帰コードが一致しません')
    }

    await this.userRepository.activateUser(userId)
    await this.authProviderRepository.activateByUserId(userId)
    await this.userQuitRepository.updateStatus(userId, 'RECOVERED')

    return { userId }
  }
}
