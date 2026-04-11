import { createUserId, type UserId } from '@repo/shared-types'
import { UserEntity } from '../entities/UserEntity'
import { IUserRepository } from '../interfaces/IUserRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaUserRepository
  extends PrismaRepositoryBase
  implements IUserRepository
{
  /**
   * 内部User IDからUserを取得（ADMINロール確認用）
   */
  async findById(userId: UserId): Promise<UserEntity | null> {
    const user = await this.connection.mUser.findFirst({
      select: {
        id: true,
        name: true,
        status: true,
        role: true,
      },
      where: {
        id: userId,
        status: 'ACTIVE',
      },
    })

    return user
      ? new UserEntity({
          id: createUserId(user.id),
          name: user.name,
          role: user.role,
          status: user.status,
        })
      : null
  }
}
