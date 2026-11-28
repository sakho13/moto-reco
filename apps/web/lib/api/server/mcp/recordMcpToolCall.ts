import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'
import { prisma } from '@repo/database'
import { PrismaMcpToolCallLogRepository } from '../repositories/PrismaMcpToolCallLogRepository'

/** 記録するツール名の最大長 */
const MAX_TOOL_NAME_LENGTH = 100

export type McpToolCallSummary = {
  toolName: string
  isError: boolean
}

/**
 * `tools/call` のリクエストと応答から、記録するツール名と成否を取り出す
 *
 * @remarks
 * `tools/call` 以外のリクエストは記録しないため null を返す。
 * JSON-RPC のエラー応答と、`result.isError` が true の応答を失敗として扱う。
 */
export function summarizeMcpToolCall(
  request: JSONRPCMessage,
  response: JSONRPCMessage
): McpToolCallSummary | null {
  if (!('method' in request) || request.method !== 'tools/call') return null
  const params = request.params as { name?: unknown } | undefined
  if (typeof params?.name !== 'string' || !params.name) return null

  const result =
    'result' in response
      ? (response.result as { isError?: unknown })
      : undefined
  const isError = 'error' in response || result?.isError === true

  return { toolName: params.name.slice(0, MAX_TOOL_NAME_LENGTH), isError }
}

/**
 * MCPツールの呼び出しを記録する
 *
 * @remarks
 * 記録に失敗しても MCP の応答には影響させず、エラーをログに出すだけにする。
 */
export async function recordMcpToolCall(params: {
  userId: string
  clientId: string | null
  request: JSONRPCMessage
  response: JSONRPCMessage
  durationMs: number
}): Promise<void> {
  const summary = summarizeMcpToolCall(params.request, params.response)
  if (!summary) return

  try {
    await new PrismaMcpToolCallLogRepository(prisma).create({
      userId: params.userId,
      clientId: params.clientId,
      toolName: summary.toolName,
      isError: summary.isError,
      durationMs: Math.round(params.durationMs),
    })
  } catch (error) {
    console.error('MCPツールの呼び出しを記録できませんでした', error)
  }
}
