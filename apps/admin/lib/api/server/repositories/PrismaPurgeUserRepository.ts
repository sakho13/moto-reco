import type { ProviderType, UserId } from '@repo/shared-types'
import {
  IPurgeUserRepository,
  PurgeTargetAuthProvider,
} from '../interfaces/IPurgeUserRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaPurgeUserRepository
  extends PrismaRepositoryBase
  implements IPurgeUserRepository
{
  async findPhotoStoragePathsByUserId(userId: UserId): Promise<string[]> {
    const photos = await this.connection.tUserPhoto.findMany({
      where: { userId },
      select: { storagePath: true },
    })
    return photos.map((p) => p.storagePath)
  }

  async findAuthProvidersByUserId(
    userId: UserId
  ): Promise<PurgeTargetAuthProvider[]> {
    const authProviders = await this.connection.mAuthProvider.findMany({
      where: { userId },
      select: { externalId: true, providerType: true },
    })
    return authProviders.map((a) => ({
      externalId: a.externalId,
      providerType: a.providerType as ProviderType,
    }))
  }

  async deletePlanHistoryAsChangedBy(userId: UserId): Promise<void> {
    await this.connection.tUserPlanHistory.deleteMany({
      where: { changedById: userId },
    })
  }

  async deleteUser(userId: UserId): Promise<void> {
    await this.connection.mUser.delete({
      where: { id: userId },
    })
  }
}
