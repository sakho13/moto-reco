import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const item = await prisma.mManufacturer.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ message: 'Not Found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const body = (await request.json()) as {
    name?: string
    nameEn?: string
    logoUrl?: string
    websiteUrl?: string
    country?: string
    isActive?: boolean
  }

  const item = await prisma.mManufacturer.update({ where: { id }, data: body })
  return NextResponse.json(item)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  await prisma.mManufacturer.delete({ where: { id } })
  return NextResponse.json({ id })
}
