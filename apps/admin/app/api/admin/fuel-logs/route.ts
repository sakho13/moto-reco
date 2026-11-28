import { type NextRequest, NextResponse } from 'next/server'
import { type Prisma, prisma } from '@repo/database'
import { parsePaginationParams, requireAdmin } from '@/lib/api/auth'
import {
  MY_BIKE_SUMMARY_SELECT,
  buildListHeaders,
  parseCreatedAtRange,
  resolveSortField,
  toMyBikeSummary,
} from '@/lib/api/history'

const SORT_FIELDS = ['createdAt', 'refueledAt'] as const

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { skip, take, sort, order, q } = parsePaginationParams(request)
  const createdAt = parseCreatedAtRange(request)

  const where: Prisma.TUserMyBikeFuelLogWhereInput = {
    ...(q ? { userMyBike: { user: { name: { contains: q } } } } : {}),
    ...(createdAt ? { createdAt } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.tUserMyBikeFuelLog.findMany({
      where,
      skip,
      take,
      orderBy: [
        { [resolveSortField(sort, SORT_FIELDS)]: order },
        { id: order },
      ],
      include: { userMyBike: { select: MY_BIKE_SUMMARY_SELECT } },
    }),
    prisma.tUserMyBikeFuelLog.count({ where }),
  ])

  const rows = data.map((log) => ({
    id: log.id,
    createdAt: log.createdAt,
    refueledAt: log.refueledAt,
    amount: log.amount,
    price: log.price,
    mileage: log.mileage,
    isFullTank: log.isFullTank,
    ...toMyBikeSummary(log.userMyBike),
  }))

  return NextResponse.json(rows, {
    headers: buildListHeaders('fuel-logs', skip, rows.length, total),
  })
}
