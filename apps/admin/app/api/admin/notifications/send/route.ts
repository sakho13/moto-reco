import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const body = (await request.json()) as {
    userId: string
    title: string
    body: string
  }

  if (!body.userId || !body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { message: 'userId・タイトル・本文は必須です' },
      { status: 400 }
    )
  }

  const user = await prisma.mUser.findFirst({
    where: { id: body.userId, status: 'ACTIVE' },
    select: { id: true },
  })

  if (!user) {
    return NextResponse.json(
      { message: 'ユーザーが見つかりません' },
      { status: 404 }
    )
  }

  await prisma.tNotification.create({
    data: {
      userId: body.userId,
      type: 'ADMIN_MESSAGE',
      title: body.title.trim(),
      body: body.body.trim(),
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
