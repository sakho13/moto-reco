import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params

  const histories = await prisma.tUserPlanHistory.findMany({
    where: { userId: id },
    orderBy: { changedAt: 'desc' },
    include: {
      changedBy: { select: { name: true } },
    },
  })

  return NextResponse.json(
    histories.map((h) => ({
      id: h.id,
      plan: h.plan,
      changedAt: h.changedAt,
      changedByName: h.changedBy.name,
      reason: h.reason,
    }))
  )
}
