import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params

  const a = await prisma.mSystemAnnouncement.findUnique({
    where: { id },
    include: {
      _count: { select: { reads: true } },
      createdByUser: { select: { id: true, name: true } },
      reads: {
        include: {
          user: { select: { id: true, name: true, notificationEmail: true } },
        },
        orderBy: { readAt: 'desc' },
      },
    },
  })

  if (!a) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: a.id,
    type: a.type,
    title: a.title,
    body: a.body,
    version: a.version,
    status: a.status,
    scheduledAt: a.scheduledAt,
    publishedAt: a.publishedAt,
    readCount: a._count.reads,
    createdBy: a.createdByUser?.name ?? '',
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    readers: a.reads.map((r) => ({
      userId: r.userId,
      name: r.user.name,
      notificationEmail: r.user.notificationEmail,
      readAt: r.readAt,
    })),
  })
}

async function update(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const existing = await prisma.mSystemAnnouncement.findUnique({
    where: { id },
    select: { status: true },
  })
  if (!existing) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }
  if (existing.status !== 'DRAFT') {
    return NextResponse.json(
      { message: '下書きのアナウンスのみ編集できます' },
      { status: 400 }
    )
  }

  const body = (await request.json()) as {
    title?: string
    body?: string
    type?: string
    version?: string | null
    scheduledAt?: string | null
  }

  const item = await prisma.mSystemAnnouncement.update({
    where: { id },
    data: {
      title: body.title,
      body: body.body,
      type: body.type as never,
      version: body.version ?? null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    },
  })

  return NextResponse.json(item)
}

// Refineのdata providerはデフォルトでPATCHを使用するため、PUTと同じ処理をPATCHにも割り当てる
export { update as PUT, update as PATCH }
