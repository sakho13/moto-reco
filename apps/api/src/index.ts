import app from './server'

app
  .listen({ port: 3002 })
  .catch((err) => {
    app.log.error(err)
    process.exit(1)
  })
  .then(() => {
    app.log.info('🚀 API is running at http://localhost:3002')
  })
