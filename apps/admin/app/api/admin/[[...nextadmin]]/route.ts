import { prisma } from '@repo/database'
import { PrismaClient } from '@premieroctet/next-admin'
import { createHandler } from '@premieroctet/next-admin/appHandler'

const { run } = createHandler({
  apiBasePath: '/api/admin',
  prisma: prisma as PrismaClient,
})

export { run as DELETE, run as GET, run as POST }
