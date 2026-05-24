import { type NextRequest, NextResponse } from 'next/server'

const ALLOWED_IPS = (process.env.ALLOWED_IPS ?? '')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean)

export function proxy(request: NextRequest) {
  // ALLOWED_IPS 未設定時は制限なし（ローカル開発用）
  if (ALLOWED_IPS.length === 0) return NextResponse.next()

  // Cloud Run は X-Forwarded-For の先頭にクライアントの実IPを付与する
  const forwarded = request.headers.get('x-forwarded-for')
  const clientIp = forwarded?.split(',')[0]?.trim() ?? ''

  if (!ALLOWED_IPS.includes(clientIp)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
