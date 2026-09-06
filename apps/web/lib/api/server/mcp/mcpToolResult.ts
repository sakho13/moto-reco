import { ApiV1Error } from '@repo/shared-domain'

/** Repository/Service層が返す NOT_FOUND を MCP の isError レスポンスに変換する */
export async function toToolResult(
  fn: () => Promise<unknown>
): Promise<{ content: { type: 'text'; text: string }[]; isError?: true }> {
  try {
    const data = await fn()
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
  } catch (error) {
    if (error instanceof ApiV1Error) {
      return { content: [{ type: 'text', text: error.message }], isError: true }
    }
    throw error
  }
}
