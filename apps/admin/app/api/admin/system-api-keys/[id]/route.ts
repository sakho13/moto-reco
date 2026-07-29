import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'
import { PrismaSystemApiKeyRepository } from '@/lib/api/server/repositories/PrismaSystemApiKeyRepository'
import { SystemApiKeyService } from '@/lib/api/server/services/SystemApiKeyService'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const { id } = await params
  const body = (await request.json()) as { isActive?: boolean }
  if (typeof body.isActive !== 'boolean') {
    return NextResponse.json(
      { message: 'isActiveはboolean型で指定してください' },
      { status: 400 }
    )
  }

  const service = new SystemApiKeyService(
    new PrismaSystemApiKeyRepository(prisma)
  )
  const systemApiKey = await service.setActive(id, body.isActive)

  return NextResponse.json({
    id: systemApiKey.id,
    name: systemApiKey.name,
    prefix: systemApiKey.prefix,
    isActive: systemApiKey.isActive,
    lastUsedAt: systemApiKey.lastUsedAt?.toISOString() ?? null,
    createdAt: systemApiKey.createdAt.toISOString(),
  })
}
