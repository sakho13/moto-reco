import { type NextRequest, NextResponse } from 'next/server'
import { CompanyCategory, prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const item = await prisma.mCompany.findUnique({ where: { id } })
  if (!item) return NextResponse.json({ message: 'Not Found' }, { status: 404 })
  return NextResponse.json(item)
}

async function update(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const body = (await request.json()) as {
    name?: string
    nameEn?: string
    logoUrl?: string
    websiteUrl?: string
    country?: string
    categories?: CompanyCategory[]
    isActive?: boolean
  }

  const item = await prisma.mCompany.update({ where: { id }, data: body })
  return NextResponse.json(item)
}

// Refineのdata providerはデフォルトでPATCHを使用するため、PUTと同じ処理をPATCHにも割り当てる
export { update as PUT, update as PATCH }

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  await prisma.mCompany.delete({ where: { id } })
  return NextResponse.json({ id })
}
