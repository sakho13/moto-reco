import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const item = await prisma.mBike.findUnique({
    where: { id },
    include: { manufacturer: { select: { id: true, name: true } } },
  })
  if (!item) return NextResponse.json({ message: 'Not Found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const body = (await request.json()) as {
    manufacturerId?: string
    modelName?: string
    displacement?: number
    modelYear?: number
    modelCode?: string
    releaseYear?: number
    releaseMonth?: number
    settingStatus?: string
  }

  const item = await prisma.mBike.update({ where: { id }, data: body as never })
  return NextResponse.json(item)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  await prisma.mBike.delete({ where: { id } })
  return NextResponse.json({ id })
}
