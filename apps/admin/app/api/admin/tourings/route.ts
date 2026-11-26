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

const SORT_FIELDS = ['createdAt', 'startDate'] as const
const TOURING_STATUSES = ['STARTED', 'COMPLETED'] as const

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { skip, take, sort, order, q } = parsePaginationParams(request)
  const createdAt = parseCreatedAtRange(request)
  const statusParam = request.nextUrl.searchParams.get('status')
  const status = TOURING_STATUSES.find((s) => s === statusParam)

  const where: Prisma.TUserMyBikeTouringWhereInput = {
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { userMyBike: { user: { name: { contains: q } } } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(createdAt ? { createdAt } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.tUserMyBikeTouring.findMany({
      where,
      skip,
      take,
      orderBy: [
        { [resolveSortField(sort, SORT_FIELDS)]: order },
        { id: order },
      ],
      include: { userMyBike: { select: MY_BIKE_SUMMARY_SELECT } },
    }),
    prisma.tUserMyBikeTouring.count({ where }),
  ])

  const rows = data.map((touring) => ({
    id: touring.id,
    createdAt: touring.createdAt,
    title: touring.title,
    status: touring.status,
    startDate: touring.startDate,
    endDate: touring.endDate,
    distance:
      touring.startMileage != null && touring.endMileage != null
        ? touring.endMileage - touring.startMileage
        : null,
    ...toMyBikeSummary(touring.userMyBike),
  }))

  return NextResponse.json(rows, {
    headers: buildListHeaders('tourings', skip, rows.length, total),
  })
}
