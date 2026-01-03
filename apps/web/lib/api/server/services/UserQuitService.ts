import {
  createUserQuitId,
  type UserId,
  type UserQuitStatus,
} from '@repo/shared-types'
import { generateRandNumberStr } from '@repo/shared-utils'
import { UserQuitEntity } from '../entities/UserQuitEntity'
import { ApiV1Error } from '../errors/ApiV1Error'
import { IUserRepository } from '../interfaces/IUserRepository'
import { IUserQuitRepository } from '../interfaces/IUserQuitRepository'
import { PrismaAuthProviderRepository } from '../repositories/PrismaAuthProviderRepository'

type QuitUserParams = {
  userId: UserId
  quitReason: string
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
    const quitAt = new Date()
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
}
