import { Hono } from 'hono'

const user = new Hono()

user.get('/profile', (c) => {
  return c.json({})
})

user.post('/profile', (c) => {
  return c.json({})
})

user.post('/register', (c) => {
  return c.json({})
})
