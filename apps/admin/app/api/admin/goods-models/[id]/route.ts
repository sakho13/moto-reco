import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const item = await prisma.mGoodsModel.findUnique({
    where: { id },
    include: { manufacturer: { select: { id: true, name: true } } },
  })
  if (!item) return NextResponse.json({ message: 'Not Found' }, { status: 404 })
  return NextResponse.json(item)
}

async function update(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const body = (await request.json()) as {
    goodsManufacturerId?: string
    modelNumber?: string
    name?: string
    category?: string
    amazonAsin?: string
    rakutenItemId?: string
    isActive?: boolean
  }

  const item = await prisma.mGoodsModel.update({
    where: { id },
    data: body as never,
  })
  return NextResponse.json(item)
}

// Refineのdata providerはデフォルトでPATCHを使用するため、PUTと同じ処理をPATCHにも割り当てる
export { update as PUT, update as PATCH }

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  await prisma.mGoodsModel.delete({ where: { id } })
  return NextResponse.json({ id })
}
