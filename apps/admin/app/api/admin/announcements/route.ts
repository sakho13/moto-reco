import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { parsePaginationParams, requireAdmin } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { skip, take, sort, order } = parsePaginationParams(request)

  const [data, total] = await Promise.all([
    prisma.mSystemAnnouncement.findMany({
      skip,
      take,
      orderBy: { [sort]: order },
      include: {
        _count: { select: { reads: true } },
        createdByUser: { select: { id: true, name: true } },
      },
    }),
    prisma.mSystemAnnouncement.count(),
  ])

  const rows = data.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    body: a.body,
    status: a.status,
    scheduledAt: a.scheduledAt,
    publishedAt: a.publishedAt,
    readCount: a._count.reads,
    createdBy: a.createdByUser?.name ?? '',
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }))

  return NextResponse.json(rows, {
    headers: {
      'X-Total-Count': String(total),
      'Content-Range': `announcements ${skip}-${skip + rows.length}/${total}`,
      'Access-Control-Expose-Headers': 'Content-Range,X-Total-Count',
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const body = (await request.json()) as {
    title: string
    body: string
    type?: string
    scheduledAt?: string | null
    publishImmediately?: boolean
  }

  const announcement = await prisma.mSystemAnnouncement.create({
    data: {
      type: (body.type ?? 'SYSTEM_MAINTENANCE') as never,
      title: body.title,
      body: body.body,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      status: 'DRAFT',
      createdBy: auth.ctx.userId,
    },
  })

  if (body.publishImmediately) {
    await prisma.mSystemAnnouncement.update({
      where: { id: announcement.id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    })
  }

  return NextResponse.json({ id: announcement.id }, { status: 201 })
}
