import { type NextRequest, NextResponse } from 'next/server'
import { type Prisma, prisma } from '@repo/database'
import { isMaintenanceType } from '@repo/shared-types'
import { parsePaginationParams, requireAdmin } from '@/lib/api/auth'
import {
  MY_BIKE_SUMMARY_SELECT,
  buildListHeaders,
  parseCreatedAtRange,
  resolveSortField,
  toMyBikeSummary,
} from '@/lib/api/history'

const SORT_FIELDS = ['createdAt', 'performedAt'] as const

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { skip, take, sort, order, q } = parsePaginationParams(request)
  const createdAt = parseCreatedAtRange(request)
  const typeParam = request.nextUrl.searchParams.get('type') ?? ''
  const type = isMaintenanceType(typeParam) ? typeParam : null

  const where: Prisma.TUserMyBikeMaintenanceWhereInput = {
    ...(q ? { userMyBike: { user: { name: { contains: q } } } } : {}),
    ...(type ? { maintenanceItems: { some: { type } } } : {}),
    ...(createdAt ? { createdAt } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.tUserMyBikeMaintenance.findMany({
      where,
      skip,
      take,
      orderBy: [
        { [resolveSortField(sort, SORT_FIELDS)]: order },
        { id: order },
      ],
      include: {
        userMyBike: { select: MY_BIKE_SUMMARY_SELECT },
        maintenanceItems: { select: { type: true } },
      },
    }),
    prisma.tUserMyBikeMaintenance.count({ where }),
  ])

  const rows = data.map((log) => ({
    id: log.id,
    createdAt: log.createdAt,
    performedAt: log.performedAt,
    mileage: log.mileage,
    itemTypes: log.maintenanceItems.map((item) => item.type),
    ...toMyBikeSummary(log.userMyBike),
  }))

  return NextResponse.json(rows, {
    headers: buildListHeaders('maintenance-logs', skip, rows.length, total),
  })
}
