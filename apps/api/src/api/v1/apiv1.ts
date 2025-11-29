import { Hono } from 'hono'
import { HonoVariables } from '../../lib/types/hono'

const ApiV1 = new Hono<{ Variables: HonoVariables }>()

export default ApiV1
