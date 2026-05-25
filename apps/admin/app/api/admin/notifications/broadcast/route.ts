import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const body = (await request.json()) as {
    title: string
    body: string
  }

  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { message: 'タイトルと本文は必須です' },
      { status: 400 }
    )
  }

  await prisma.mSystemAnnouncement.create({
    data: {
      type: 'SYSTEM_MAINTENANCE',
      title: body.title.trim(),
      body: body.body.trim(),
      status: 'PUBLISHED',
      publishedAt: new Date(),
      createdBy: auth.ctx.userId,
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
