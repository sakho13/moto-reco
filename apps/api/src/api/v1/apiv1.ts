import { Hono } from 'hono'
import { HonoVariables } from '../../lib/types/hono'
import user from './user'

const ApiV1 = new Hono<{ Variables: HonoVariables }>()

ApiV1.route('/user', user)

export default ApiV1
