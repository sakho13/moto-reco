import {
  createUserId,
  createUserQuitId,
  type UserId,
  type UserQuitStatus,
} from '@repo/shared-types'
import { UserQuitEntity } from '../entities/UserQuitEntity'
import { IUserQuitRepository } from '../interfaces/IUserQuitRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

const SELECT = {
  id: true,
  userId: true,
  quitAt: true,
  quitReason: true,
  recoveryTokenHash: true,
  purgeAt: true,
  status: true,
} as const

function toEntity(row: {
  id: string
  userId: string
  quitAt: Date
  quitReason: string
  recoveryTokenHash: string
  purgeAt: Date
  status: UserQuitStatus
}): UserQuitEntity {
  return new UserQuitEntity({
    id: createUserQuitId(row.id),
    userId: createUserId(row.userId),
    quitAt: row.quitAt,
    quitReason: row.quitReason,
    recoveryTokenHash: row.recoveryTokenHash,
    purgeAt: row.purgeAt,
    status: row.status,
  })
}

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
        recoveryTokenHash: userQuit.recoveryTokenHash,
        purgeAt: userQuit.purgeAt,
        status: userQuit.status,
      },
      select: SELECT,
    })

    return toEntity(created)
  }

  async findByUserId(userId: UserId): Promise<UserQuitEntity | null> {
    const userQuit = await this.connection.tUserQuit.findUnique({
      where: {
        userId,
      },
      select: SELECT,
    })

    return userQuit ? toEntity(userQuit) : null
  }

  async findByRecoveryTokenHash(
    recoveryTokenHash: string
  ): Promise<UserQuitEntity | null> {
    const userQuit = await this.connection.tUserQuit.findFirst({
      where: {
        recoveryTokenHash,
      },
      select: SELECT,
    })

    return userQuit ? toEntity(userQuit) : null
  }

  async updateStatus(userId: UserId, status: UserQuitStatus): Promise<void> {
    await this.connection.tUserQuit.update({
      where: {
        userId,
      },
      data: {
        status,
      },
    })
  }

  async findPurgeTargets(now: Date): Promise<UserQuitEntity[]> {
    const rows = await this.connection.tUserQuit.findMany({
      where: {
        status: 'QUIT',
        purgeAt: { lte: now },
      },
      select: SELECT,
    })

    return rows.map(toEntity)
  }
}
