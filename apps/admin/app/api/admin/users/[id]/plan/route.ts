import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const body = (await request.json()) as {
    plan: 'FREE' | 'PREMIUM'
    reason?: string | null
  }

  if (!body.plan || !['FREE', 'PREMIUM'].includes(body.plan)) {
    return NextResponse.json(
      { message: 'plan は FREE または PREMIUM を指定してください' },
      { status: 400 }
    )
  }

  const targetUser = await prisma.mUser.findUnique({
    where: { id },
    select: { role: true },
  })

  if (!targetUser) {
    return NextResponse.json({ message: 'Not Found' }, { status: 404 })
  }

  if (targetUser.role !== 'USER') {
    return NextResponse.json(
      { message: 'プラン管理は USER ロールのユーザーにのみ適用できます' },
      { status: 403 }
    )
  }

  const history = await prisma.tUserPlanHistory.create({
    data: {
      userId: id,
      plan: body.plan,
      changedById: auth.ctx.userId,
      reason: body.reason ?? null,
    },
    include: {
      changedBy: { select: { name: true } },
    },
  })

  return NextResponse.json({
    id: history.id,
    plan: history.plan,
    changedAt: history.changedAt,
    changedByName: history.changedBy.name,
    reason: history.reason,
  })
}
