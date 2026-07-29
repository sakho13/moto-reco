import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { parsePaginationParams, requireAdmin } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { skip, take, sort, order, q } = parsePaginationParams(request)
  const goodsManufacturerId =
    request.nextUrl.searchParams.get('goodsManufacturerId') ?? ''
  const category = request.nextUrl.searchParams.get('category') ?? ''

  const where = {
    ...(q
      ? { OR: [{ name: { contains: q } }, { modelNumber: { contains: q } }] }
      : {}),
    ...(goodsManufacturerId ? { goodsManufacturerId } : {}),
    ...(category ? { category: category as never } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.mGoodsModel.findMany({
      where,
      skip,
      take,
      orderBy: { [sort]: order },
      include: { manufacturer: { select: { id: true, name: true } } },
    }),
    prisma.mGoodsModel.count({ where }),
  ])

  return NextResponse.json(data, {
    headers: {
      'X-Total-Count': String(total),
      'Content-Range': `goods-models ${skip}-${skip + data.length}/${total}`,
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const body = (await request.json()) as {
    goodsManufacturerId: string
    modelNumber: string
    name: string
    category: string
    amazonAsin?: string
    rakutenItemId?: string
    officialUrl?: string
    isActive?: boolean
  }

  const model = await prisma.mGoodsModel.create({ data: body as never })
  return NextResponse.json(model, { status: 201 })
}
