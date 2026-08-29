import { Hono } from 'hono'
import { prisma } from '@repo/database'
import {
  ApiResponseMopedTestQuestionSet,
  ApiResponseReleaseNoteList,
  SuccessResponse,
} from '@repo/shared-types'
import { PrismaAnnouncementRepository } from '../repositories/PrismaAnnouncementRepository'
import { AnnouncementService } from '../services/AnnouncementService'
import { getMopedTestQuestionSet } from '@/lib/moped-test/questions'

const publicRoute = new Hono()

publicRoute.get('/moped-test/questions', async (c) => {
  return c.json<SuccessResponse<ApiResponseMopedTestQuestionSet>>({
    status: 'success',
    data: getMopedTestQuestionSet(),
    message: '原付学科試験の問題取得成功',
  })
})

publicRoute.get('/release-notes', async (c) => {
  const service = new AnnouncementService(
    new PrismaAnnouncementRepository(prisma)
  )
  const releaseNotes = await service.getPublishedReleaseNotes()
  return c.json<SuccessResponse<ApiResponseReleaseNoteList>>({
    status: 'success',
    data: { releaseNotes },
  })
})

export default publicRoute
