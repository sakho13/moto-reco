import { prisma } from '@repo/database'
import { type NextRequest, NextResponse } from 'next/server'
import { parsePaginationParams, requireAdmin } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { skip, take, sort, order, q } = parsePaginationParams(request)

  const where = q
    ? {
        OR: [{ name: { contains: q } }, { notificationEmail: { contains: q } }],
      }
    : {}

  const [data, total] = await Promise.all([
    prisma.mUser.findMany({
      where,
      skip,
      take,
      orderBy: { [sort]: order },
      include: {
        authProviders: { select: { providerType: true, externalId: true } },
      },
    }),
    prisma.mUser.count({ where }),
  ])

  return NextResponse.json(data, {
    headers: {
      'X-Total-Count': String(total),
      'Content-Range': `users ${skip}-${skip + data.length}/${total}`,
    },
  })
}
