import { createUserId, type UserId } from '@shared-types/index'
import { IUserRepository } from '../../interfaces/IUserRepository'
import { PrismaRepositoryBase } from '../common/PrismaRepositoryBase'
import { AuthProviderEntity } from '../entities/AuthProviderEntity'
import { UserEntity } from '../entities/UserEntity'

export class PrismaUserRepository
  extends PrismaRepositoryBase
  implements IUserRepository
{
  /**
   * 内部User IDからUserを取得
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

  /**
   * AuthProviderからUserを取得（非推奨: 後方互換性のため残す）
   * @deprecated findByIdを使用してください
   */
  async findByAuthProvider(
    authProvider: AuthProviderEntity
  ): Promise<UserEntity | null> {
    const user = await this.connection.mUser.findFirst({
      select: {
        id: true,
        name: true,
        status: true,
        role: true,
      },
      where: {
        authProviders: {
          some: {
            userId: authProvider.userId,
          },
        },
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

  /**
   * ユーザー情報を更新
   *
   * @param userId - 更新対象のユーザーID
   * @param data - 更新データ
   * @returns 更新後のUserEntity
   */
  async updateUser(user: UserEntity): Promise<UserEntity> {
    const updatedUser = await this.connection.mUser.update({
      where: {
        id: user.id,
        status: 'ACTIVE',
      },
      data: {
        name: user.name,
      },
      select: {
        id: true,
        name: true,
        status: true,
        role: true,
      },
    })

    return new UserEntity({
      id: createUserId(updatedUser.id),
      name: updatedUser.name,
      role: updatedUser.role,
      status: updatedUser.status,
    })
  }
}
