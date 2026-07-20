import { BASE_URL } from './env'

/**
 * API 経由でテスト用 MCP APIキーを発行し、apiKeyId を返す
 *
 * @param token - Firebase ID トークン
 * @param keyName - キー名
 * @param scopes - スコープ配列（デフォルト: ["READ"]）
 */
export async function issueTestApiKey(
  token: string,
  keyName: string,
  scopes: string[] = ['READ']
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/v1/mcp/api-keys`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: keyName, scopes }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    throw new Error(`APIキー発行失敗: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as { data: { apiKeyId: string } }
  return json.data.apiKeyId
}

/**
 * API 経由でテスト用 MCP APIキーを削除する
 *
 * @param token - Firebase ID トークン
 * @param apiKeyId - 削除するAPIキーのID
 */
export async function deleteTestApiKey(
  token: string,
  apiKeyId: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/mcp/api-keys/${apiKeyId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    throw new Error(`APIキー削除失敗: ${res.status} ${await res.text()}`)
  }
}
