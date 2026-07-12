import { type NextRequest, NextResponse } from 'next/server'
import { CompanyCategory, prisma } from '@repo/database'
import { parsePaginationParams, requireAdmin } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { skip, take, sort, order, q } = parsePaginationParams(request)
  const category = request.nextUrl.searchParams.get('category')

  const where = {
    ...(q
      ? { OR: [{ name: { contains: q } }, { nameEn: { contains: q } }] }
      : {}),
    ...(category ? { categories: { has: category as CompanyCategory } } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.mCompany.findMany({
      where,
      skip,
      take,
      orderBy: { [sort]: order },
    }),
    prisma.mCompany.count({ where }),
  ])

  return NextResponse.json(data, {
    headers: {
      'X-Total-Count': String(total),
      'Content-Range': `companies ${skip}-${skip + data.length}/${total}`,
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
    country?: string
    categories: CompanyCategory[]
    isActive?: boolean
  }

  const company = await prisma.mCompany.create({ data: body })
  return NextResponse.json(company, { status: 201 })
}
