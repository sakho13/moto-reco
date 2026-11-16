import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { getFirebaseAdminAuthClient } from '@repo/firebase-auth-server'

export type AdminContext = {
  uid: string
  userId: string
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

    return { ctx: { uid: decoded.uid, userId: user.id } }
  } catch {
    return {
      error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    }
  }
}

/** 一覧APIで1回に取得できる最大件数（選択肢用に200件取得する画面があるため余裕を持たせる） */
const MAX_PAGE_TAKE = 500

/**
 * 非負整数としてクエリ値を読み取る（不正値は既定値）
 */
function parseNonNegativeInt(value: string | null, fallback: number): number {
  if (value === null) return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

/**
 * refine の simple-rest 形式のページング・ソートパラメータを読み取る
 *
 * @remarks
 * 不正な `_start` / `_end` がそのまま Prisma の skip / take に渡って 500 にならないよう、
 * 非負整数に正規化し、取得件数を 1〜{@link MAX_PAGE_TAKE} に収める。
 */
export function parsePaginationParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const start = parseNonNegativeInt(searchParams.get('_start'), 0)
  const end = parseNonNegativeInt(searchParams.get('_end'), start + 10)
  const take = Math.min(Math.max(end - start, 1), MAX_PAGE_TAKE)
  const sort = searchParams.get('_sort') ?? 'createdAt'
  const order: 'asc' | 'desc' =
    searchParams.get('_order')?.toLowerCase() === 'asc' ? 'asc' : 'desc'
  const q = searchParams.get('q') ?? ''

  return { skip: start, take, sort, order, q }
}
