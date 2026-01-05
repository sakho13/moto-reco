import { ProviderType, UserId } from '@repo/shared-types'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

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
}
