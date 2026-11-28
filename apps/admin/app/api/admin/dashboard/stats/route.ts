import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { getCurrentDate } from '@repo/shared-utils'
import { requireAdmin } from '@/lib/api/auth'
import { PrismaDashboardStatsRepository } from '@/lib/api/server/repositories/PrismaDashboardStatsRepository'
import { DashboardStatsService } from '@/lib/api/server/services/DashboardStatsService'
import { STATS_PERIOD_DAYS, parseStatsPeriodDays } from '@/lib/jstPeriod'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const days = parseStatsPeriodDays(request.nextUrl.searchParams.get('days'))
  if (!days) {
    return NextResponse.json(
      { message: `days は ${STATS_PERIOD_DAYS.join(' / ')} のいずれか` },
      { status: 400 }
    )
  }

  const service = new DashboardStatsService(
    new PrismaDashboardStatsRepository(prisma)
  )
  const stats = await service.getStats(getCurrentDate(), days)

  return NextResponse.json(stats)
}
