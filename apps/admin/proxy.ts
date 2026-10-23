import { type NextRequest, NextResponse } from 'next/server'

const ALLOWED_IPS = (process.env.ALLOWED_IPS ?? '')
  .split(',')
  .map((ip) => ip.trim())
  .filter(Boolean)

export function proxy(request: NextRequest) {
  // ALLOWED_IPS 未設定時は制限なし（ローカル開発用）
  if (ALLOWED_IPS.length === 0) return NextResponse.next()

  // Cloud Run（ドメインマッピング）はクライアント送信の X-Forwarded-For の末尾に実IPを追記する
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  const clientIp =
    forwarded
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean)
      .at(-1) ?? ''

  if (!ALLOWED_IPS.includes(clientIp)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  // /api/internal 配下はGitHub Actions等の外部からシステムAPIキーで
  // 認証される内部バッチ用エンドポイントのため、IP制限の対象から除外する
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/internal).*)'],
}
