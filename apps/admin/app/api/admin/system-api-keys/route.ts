import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/api/auth'
import { PrismaSystemApiKeyRepository } from '@/lib/api/server/repositories/PrismaSystemApiKeyRepository'
import { SystemApiKeyService } from '@/lib/api/server/services/SystemApiKeyService'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const service = new SystemApiKeyService(
    new PrismaSystemApiKeyRepository(prisma)
  )
  const keys = await service.listApiKeys()

  const rows = keys.map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    isActive: k.isActive,
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    createdAt: k.createdAt.toISOString(),
  }))

  return NextResponse.json(rows, {
    headers: {
      'X-Total-Count': String(rows.length),
      'Content-Range': `system-api-keys 0-${rows.length}/${rows.length}`,
      'Access-Control-Expose-Headers': 'Content-Range,X-Total-Count',
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  const body = (await request.json()) as { name?: string }
  const name = body.name?.trim()
  if (!name || name.length > 50) {
    return NextResponse.json(
      { message: 'nameは1〜50文字で指定してください' },
      { status: 400 }
    )
  }

  const service = new SystemApiKeyService(
    new PrismaSystemApiKeyRepository(prisma)
  )
  const { systemApiKey, fullKey } = await service.generateApiKey({ name })

  return NextResponse.json(
    {
      id: systemApiKey.id,
      name: systemApiKey.name,
      prefix: systemApiKey.prefix,
      isActive: systemApiKey.isActive,
      lastUsedAt: systemApiKey.lastUsedAt?.toISOString() ?? null,
      createdAt: systemApiKey.createdAt.toISOString(),
      fullKey,
    },
    { status: 201 }
  )
}
