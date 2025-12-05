import { createHandler } from '@premieroctet/next-admin/appHandler'
import { prisma } from '@/lib/prisma'
import { options } from '@/lib/options'
import schema from '@packages/database/json-schema'

const { run } = createHandler({
  apiBasePath: '/api/admin',
  prisma,
  schema,
  options,
})

export { run as DELETE, run as GET, run as POST }
