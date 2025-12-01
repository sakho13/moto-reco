import { Hono } from 'hono'
import { honoAuthMiddleware } from '../../lib/middlewares/honoAuth'

const userBike = new Hono()

userBike.get('/bikes', honoAuthMiddleware, async (c) => {
  return c.json({})
})

userBike.post('/register', honoAuthMiddleware, async (c) => {
  return c.json({})
})

userBike.get('/bike/:userBikeId', honoAuthMiddleware, async (c) => {
  return c.json({})
})

export default userBike
