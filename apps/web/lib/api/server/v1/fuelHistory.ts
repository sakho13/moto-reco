import { Hono } from 'hono'

const fuelHistory = new Hono()

fuelHistory.get('/fuel-history/:userBikeId', async (c) => {
  return c.json({})
})

fuelHistory.post('/fuel-history/:userBikeId', async (c) => {
  return c.json({})
})

fuelHistory.patch('/fuel-history/:userBikeId/:fuelHistoryId', async (c) => {
  return c.json({})
})

fuelHistory.delete('/fuel-history/:userBikeId/:fuelHistoryId', async (c) => {
  return c.json({})
})

export default fuelHistory
