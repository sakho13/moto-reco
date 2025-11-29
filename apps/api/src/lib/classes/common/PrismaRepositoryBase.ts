import { PrismaClient } from '@packages/database'

export abstract class PrismaRepositoryBase {
  protected connection: PrismaClient

  constructor(connection: PrismaClient) {
    this.connection = connection
  }
}
