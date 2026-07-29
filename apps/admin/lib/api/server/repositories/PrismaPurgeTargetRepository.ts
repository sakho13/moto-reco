import { createUserId } from '@repo/shared-types'
import {
  IPurgeTargetRepository,
  PurgeTargetUser,
} from '../interfaces/IPurgeTargetRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaPurgeTargetRepository
  extends PrismaRepositoryBase
  implements IPurgeTargetRepository
{
  async findPurgeTargets(now: Date): Promise<PurgeTargetUser[]> {
    const rows = await this.connection.tUserQuit.findMany({
      where: {
        status: 'QUIT',
        purgeAt: { lte: now },
      },
      select: { userId: true },
    })

    return rows.map((row) => ({ userId: createUserId(row.userId) }))
  }
}
