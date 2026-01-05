import { createUserId, createUserQuitId } from '@repo/shared-types'
import { UserQuitEntity } from '../entities/UserQuitEntity'
import { IUserQuitRepository } from '../interfaces/IUserQuitRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaUserQuitRepository
  extends PrismaRepositoryBase
  implements IUserQuitRepository
{
  async create(userQuit: UserQuitEntity): Promise<UserQuitEntity> {
    const created = await this.connection.tUserQuit.create({
      data: {
        userId: userQuit.userId,
        quitAt: userQuit.quitAt,
        quitReason: userQuit.quitReason,
        recoveryCode: userQuit.recoveryCode,
        status: userQuit.status,
      },
      select: {
        id: true,
        userId: true,
        quitAt: true,
        quitReason: true,
        recoveryCode: true,
        status: true,
      },
    })

    return new UserQuitEntity({
      id: createUserQuitId(created.id),
      userId: createUserId(created.userId),
      quitAt: created.quitAt,
      quitReason: created.quitReason,
      recoveryCode: created.recoveryCode,
      status: created.status,
    })
  }
}
