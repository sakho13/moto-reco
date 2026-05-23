import { prisma } from '@repo/database'
import { type NextRequest, NextResponse } from 'next/server'
import { parsePaginationParams, requireAdmin } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { skip, take, sort, order, q } = parsePaginationParams(request)
  const manufacturerId = request.nextUrl.searchParams.get('manufacturerId') ?? ''

  const where = {
    ...(q ? { modelName: { contains: q } } : {}),
    ...(manufacturerId ? { manufacturerId } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.mBike.findMany({
      where,
      skip,
      take,
      orderBy: { [sort]: order },
      include: { manufacturer: { select: { id: true, name: true } } },
    }),
    prisma.mBike.count({ where }),
  ])

  return NextResponse.json(data, {
    headers: {
      'X-Total-Count': String(total),
      'Content-Range': `bikes ${skip}-${skip + data.length}/${total}`,
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const body = (await request.json()) as {
    manufacturerId: string
    modelName: string
    displacement: number
    modelYear: number
    modelCode: string
    releaseYear: number
    releaseMonth: number
    settingStatus?: string
  }

  const bike = await prisma.mBike.create({ data: body as never })
  return NextResponse.json(bike, { status: 201 })
}
