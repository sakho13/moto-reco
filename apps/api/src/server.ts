import Fastify from 'fastify'

const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production'

const app = Fastify({
  logger: IS_DEVELOPMENT,
})

app.get('/api/health', async () => {
  return { status: 'ok' }
})

export default app
