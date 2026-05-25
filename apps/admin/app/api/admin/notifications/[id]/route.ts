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

  const n = await prisma.tNotification.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, notificationEmail: true } },
    },
  })

  if (!n) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: n.id,
    userId: n.user.id,
    userName: n.user.name,
    notificationEmail: n.user.notificationEmail,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    readAt: n.readAt,
    createdAt: n.createdAt,
  })
}
