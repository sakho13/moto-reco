import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const user = await prisma.mUser.findUnique({
    where: { id },
    include: {
      authProviders: {
        select: { providerType: true, externalId: true, isActive: true },
      },
      myBikes: {
        include: {
          userBike: {
            include: {
              bike: {
                include: { manufacturer: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { ownedAt: 'desc' },
      },
    },
  })

  if (!user) return NextResponse.json({ message: 'Not Found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const body = (await request.json()) as { status?: string; role?: string }

  const user = await prisma.mUser.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status as never }),
      ...(body.role && { role: body.role as never }),
    },
  })

  return NextResponse.json(user)
}

export async function PUT(request: NextRequest, context: Params) {
  return PATCH(request, context)
}
