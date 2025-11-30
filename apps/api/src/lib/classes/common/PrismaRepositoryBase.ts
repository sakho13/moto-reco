import { PrismaClient } from '@packages/database'

type PrismaTransactionOrClient =
  | PrismaClient
  | Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
    >
export abstract class PrismaRepositoryBase {
  protected connection: PrismaTransactionOrClient

  constructor(connection: PrismaTransactionOrClient) {
    this.connection = connection
  }
}
