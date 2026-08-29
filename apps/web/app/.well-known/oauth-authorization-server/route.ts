import { NextResponse } from 'next/server'
import { WEB_URL } from '@/lib/statics'

/**
 * OAuth 2.0 Authorization Server Metadata（RFC 8414）
 *
 * @remarks
 * MCPクライアント（Claude.ai / ChatGPT等）が認可エンドポイント・トークンエンドポイント・
 * DCRエンドポイントのURLを自動検出するために参照するメタデータ。
 * `WEB_URL`（トンネルURL等）を都度反映するため、Next.jsによる静的キャッシュを禁止する。
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      issuer: WEB_URL,
      authorization_endpoint: `${WEB_URL}/app/oauth/authorize`,
      token_endpoint: `${WEB_URL}/api/v1/mcp/oauth/token`,
      registration_endpoint: `${WEB_URL}/api/v1/mcp/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none', 'client_secret_basic'],
      scopes_supported: ['read', 'write'],
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
