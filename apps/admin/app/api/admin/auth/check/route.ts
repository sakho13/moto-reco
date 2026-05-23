import { type NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request)
  if ('error' in result) return result.error
  return NextResponse.json({ ok: true })
}
