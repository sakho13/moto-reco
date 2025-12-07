import { serve } from '@hono/node-server'
import app from './server'

const port = Number(process.env.API_PORT) || 3002
console.log(`🚀 Hono API running at http://localhost:${port}`)

const server = serve({ fetch: app.fetch, port })

process.on('SIGINT', () => {
  server.close()
  process.exit(0)
})

process.on('SIGTERM', () => {
  server.close((err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    process.exit(0)
  })
})
