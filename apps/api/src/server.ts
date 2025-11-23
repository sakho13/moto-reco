import Fastify from 'fastify'
import { prisma } from '@packages/database'

const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production'

const app = Fastify({
  logger: IS_DEVELOPMENT,
})

app.get('/api/health', async () => {
  const databaseCheck = await checkDatabase()
  return { status: 'ok', db: databaseCheck ? 'ok' : 'error' }
})

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1 as result`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

export default app
