import { Hono } from 'hono'
import { HonoVariables } from '../types/hono'
import adminAnnouncements from './admin/announcements'
import announcements from './announcements'
import bikes from './bikes'
import maintenance from './maintenance'
import notifications from './notifications'
import publicRoute from './public'
import user from './user'
import userBike from './userBike'

const ApiV1 = new Hono<{ Variables: HonoVariables }>()

ApiV1.route('/user', user)
ApiV1.route('/bikes', bikes)
ApiV1.route('/user-bike', userBike)
ApiV1.route('/maintenance', maintenance)
ApiV1.route('/public', publicRoute)
ApiV1.route('/notifications', notifications)
ApiV1.route('/announcements', announcements)
ApiV1.route('/admin/announcements', adminAnnouncements)

export default ApiV1
