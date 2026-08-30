import { NextResponse } from 'next/server'
import { WEB_URL } from '@/lib/statics'

/**
 * OAuth 2.0 Protected Resource Metadata（RFC 9728）
 *
 * @remarks
 * MCPサーバー（/api/mcp）がどの認可サーバーによって保護されているかをクライアントに伝える。
 * `WEB_URL`（トンネルURL等）を都度反映するため、Next.jsによる静的キャッシュを禁止する。
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      resource: `${WEB_URL}/api/mcp`,
      authorization_servers: [WEB_URL],
      scopes_supported: ['read', 'write'],
      bearer_methods_supported: ['header'],
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
