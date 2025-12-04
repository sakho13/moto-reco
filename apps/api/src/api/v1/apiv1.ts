import { Hono } from 'hono'
import { HonoVariables } from '../../lib/types/hono'
import bikes from './bikes'
import user from './user'

const ApiV1 = new Hono<{ Variables: HonoVariables }>()

ApiV1.route('/user', user)
ApiV1.route('/bikes', bikes)

export default ApiV1
