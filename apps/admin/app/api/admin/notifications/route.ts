import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { parsePaginationParams, requireAdmin } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { skip, take, sort, order } = parsePaginationParams(request)
  const { searchParams } = request.nextUrl
  const userId = searchParams.get('userId') ?? ''
  const type = searchParams.get('type') ?? ''

  const where = {
    ...(userId ? { userId } : {}),
    ...(type ? { type: type as never } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.tNotification.findMany({
      where,
      skip,
      take,
      orderBy: { [sort === 'createdAt' ? 'createdAt' : sort]: order },
      include: {
        user: { select: { id: true, name: true, notificationEmail: true } },
      },
    }),
    prisma.tNotification.count({ where }),
  ])

  const rows = data.map((n) => ({
    id: n.id,
    userId: n.userId,
    userName: n.user.name,
    notificationEmail: n.user.notificationEmail,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    readAt: n.readAt,
    createdAt: n.createdAt,
  }))

  return NextResponse.json(rows, {
    headers: {
      'X-Total-Count': String(total),
      'Content-Range': `notifications ${skip}-${skip + rows.length}/${total}`,
      'Access-Control-Expose-Headers': 'Content-Range,X-Total-Count',
    },
  })
}
