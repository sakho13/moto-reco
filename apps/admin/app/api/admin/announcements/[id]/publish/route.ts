import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params

  const announcement = await prisma.mSystemAnnouncement.findUnique({
    where: { id },
    select: { status: true },
  })

  if (!announcement) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }
  if (announcement.status !== 'DRAFT') {
    return NextResponse.json(
      { message: 'DRAFT状態のアナウンスのみ公開できます' },
      { status: 400 }
    )
  }

  await prisma.mSystemAnnouncement.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  })

  return NextResponse.json({ id })
}
