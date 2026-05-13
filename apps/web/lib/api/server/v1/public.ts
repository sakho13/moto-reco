import { Hono } from 'hono'
import {
  ApiResponseMopedTestQuestionSet,
  SuccessResponse,
} from '@repo/shared-types'
import { getMopedTestQuestionSet } from '@/lib/moped-test/questions'

const publicRoute = new Hono()

publicRoute.get('/moped-test/questions', async (c) => {
  return c.json<SuccessResponse<ApiResponseMopedTestQuestionSet>>({
    status: 'success',
    data: getMopedTestQuestionSet(),
    message: '原付学科試験の問題取得成功',
  })
})

export default publicRoute
