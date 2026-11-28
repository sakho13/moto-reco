import type { IMcpToolCallLogRepository } from '@repo/shared-domain'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaMcpToolCallLogRepository
  extends PrismaRepositoryBase
  implements IMcpToolCallLogRepository
{
  async create(params: {
    userId: string
    clientId: string | null
    toolName: string
    isError: boolean
    durationMs: number
  }): Promise<void> {
    await this.connection.tMcpToolCallLog.create({ data: params })
  }
}
