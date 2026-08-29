import { UserQuitEntity, IUserQuitRepository } from '@repo/shared-domain'
import {
  createUserId,
  createUserQuitId,
  type UserId,
  type UserQuitStatus,
} from '@repo/shared-types'
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
    // userIdはユニーク制約のため、復帰(RECOVERED)済みユーザーが再度退会する場合は
    // 既存レコードを新しい退会情報で上書きする
    const data = {
      quitAt: userQuit.quitAt,
      quitReason: userQuit.quitReason,
      recoveryTokenHash: userQuit.recoveryTokenHash,
      purgeAt: userQuit.purgeAt,
      status: userQuit.status,
    }

    const saved = await this.connection.tUserQuit.upsert({
      where: { userId: userQuit.userId },
      create: { userId: userQuit.userId, ...data },
      update: data,
      select: SELECT,
    })

    return toEntity(saved)
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
