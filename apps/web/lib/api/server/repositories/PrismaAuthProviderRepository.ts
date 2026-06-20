import { ProviderType, UserId, UserPlan } from '@repo/shared-types'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export type ActiveUserInfo = {
  userId: string
  role: 'USER' | 'ADMIN' | 'GUEST'
  plan: UserPlan | null
  createdAt: Date
}

export class PrismaAuthProviderRepository extends PrismaRepositoryBase {
  /**
   * 外部ID（Firebase UIDなど）からアクティブな内部User IDを取得
   */
  async findActiveUserIdByExternalId(
    externalId: string,
    providerType: ProviderType
  ): Promise<string | null> {
    const authProvider = await this.connection.mAuthProvider.findFirst({
      select: {
        user: {
          select: { id: true },
        },
      },
      where: {
        externalId: externalId,
        providerType: providerType,
        isActive: true,
        user: {
          status: 'ACTIVE',
        },
      },
    })

    return authProvider?.user?.id ?? null
  }

  /**
   * 外部ID（Firebase UIDなど）からアクティブなユーザー情報（ID・ロール・作成日時）を取得
   */
  async findActiveUserInfoByExternalId(
    externalId: string,
    providerType: ProviderType
  ): Promise<ActiveUserInfo | null> {
    const authProvider = await this.connection.mAuthProvider.findFirst({
      select: {
        user: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            planHistories: {
              orderBy: { changedAt: 'desc' as const },
              take: 1,
              select: { plan: true },
            },
          },
        },
      },
      where: {
        externalId: externalId,
        providerType: providerType,
        isActive: true,
        user: {
          status: 'ACTIVE',
        },
      },
    })

    if (!authProvider?.user) return null

    const plan =
      (authProvider.user.planHistories[0]?.plan as UserPlan | undefined) ?? null

    return {
      userId: authProvider.user.id,
      role: authProvider.user.role as ActiveUserInfo['role'],
      plan,
      createdAt: authProvider.user.createdAt,
    }
  }

  /**
   * 外部ID（Firebase UIDなど）から内部User IDを取得（アクティブ判定なし）
   */
  async findUserIdByExternalId(
    externalId: string,
    providerType: ProviderType
  ): Promise<string | null> {
    const authProvider = await this.connection.mAuthProvider.findFirst({
      select: {
        user: {
          select: { id: true },
        },
      },
      where: {
        externalId: externalId,
        providerType: providerType,
      },
    })

    return authProvider?.user?.id ?? null
  }

  /**
   * 指定ユーザーの認証プロバイダを無効化
   */
  async deactivateByUserId(userId: UserId): Promise<void> {
    await this.connection.mAuthProvider.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })
  }

  /**
   * 指定ユーザーの認証プロバイダを有効化
   */
  async activateByUserId(userId: UserId): Promise<void> {
    await this.connection.mAuthProvider.updateMany({
      where: {
        userId,
        isActive: false,
      },
      data: {
        isActive: true,
      },
    })
  }
}
