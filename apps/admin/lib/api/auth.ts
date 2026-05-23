import { getFirebaseAdminAuthClient } from '@repo/firebase-auth-server'
import { prisma } from '@repo/database'
import { type NextRequest, NextResponse } from 'next/server'

export type AdminContext = {
  uid: string
}

export async function requireAdmin(
  request: NextRequest
): Promise<{ ctx: AdminContext } | { error: NextResponse }> {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return {
      error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    }
  }

  const token = authorization.slice(7)
  try {
    const auth = getFirebaseAdminAuthClient()
    const decoded = await auth.verifyIdToken(token)

    const user = await prisma.mUser.findFirst({
      where: {
        authProviders: { some: { externalId: decoded.uid, isActive: true } },
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      select: { id: true },
    })

    if (!user) {
      return {
        error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }),
      }
    }

    return { ctx: { uid: decoded.uid } }
  } catch {
    return {
      error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    }
  }
}

export function parsePaginationParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const start = Number(searchParams.get('_start') ?? 0)
  const end = Number(searchParams.get('_end') ?? 10)
  const sort = searchParams.get('_sort') ?? 'createdAt'
  const order = (searchParams.get('_order') ?? 'desc').toLowerCase() as
    | 'asc'
    | 'desc'
  const q = searchParams.get('q') ?? ''

  return { skip: start, take: end - start, sort, order, q }
}
