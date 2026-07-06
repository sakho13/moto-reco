import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { parsePaginationParams, requireAdmin } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { skip, take, sort, order, q } = parsePaginationParams(request)

  const where = q
    ? { OR: [{ name: { contains: q } }, { nameEn: { contains: q } }] }
    : {}

  const [data, total] = await Promise.all([
    prisma.mGoodsManufacturer.findMany({
      where,
      skip,
      take,
      orderBy: { [sort]: order },
    }),
    prisma.mGoodsManufacturer.count({ where }),
  ])

  return NextResponse.json(data, {
    headers: {
      'X-Total-Count': String(total),
      'Content-Range': `goods-manufacturers ${skip}-${skip + data.length}/${total}`,
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const body = (await request.json()) as {
    name: string
    nameEn?: string
    logoUrl?: string
    websiteUrl?: string
    isActive?: boolean
  }

  const manufacturer = await prisma.mGoodsManufacturer.create({ data: body })
  return NextResponse.json(manufacturer, { status: 201 })
}
