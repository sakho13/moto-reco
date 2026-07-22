import { Hono } from 'hono'
import { HonoVariables } from '../types/hono'
import announcements from './announcements'
import bikes from './bikes'
import goods from './goods'
import internal from './internal'
import maintenance from './maintenance'
import notifications from './notifications'
import photo from './photo'
import publicRoute from './public'
import systemApiKeys from './systemApiKeys'
import user from './user'
import userBike from './userBike'

const ApiV1 = new Hono<{ Variables: HonoVariables }>()

ApiV1.route('/user', user)
ApiV1.route('/bikes', bikes)
ApiV1.route('/goods', goods)
ApiV1.route('/user-bike', userBike)
ApiV1.route('/maintenance', maintenance)
ApiV1.route('/public', publicRoute)
ApiV1.route('/photo', photo)
ApiV1.route('/notifications', notifications)
ApiV1.route('/announcements', announcements)
ApiV1.route('/internal', internal)
ApiV1.route('/admin/system-api-keys', systemApiKeys)

export default ApiV1
