import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'
import { describe, expect, test } from 'vitest'
import { summarizeMcpToolCall } from '@/lib/api/server/mcp/recordMcpToolCall'

const toolsCall = (name: unknown): JSONRPCMessage => ({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: { name, arguments: {} },
})

const success: JSONRPCMessage = {
  jsonrpc: '2.0',
  id: 1,
  result: { content: [{ type: 'text', text: 'ok' }] },
}

describe('summarizeMcpToolCall()', () => {
  test('tools/call の成功応答 → ツール名と isError: false', () => {
    expect(summarizeMcpToolCall(toolsCall('list_bikes'), success)).toEqual({
      toolName: 'list_bikes',
      isError: false,
    })
  })

  test('result.isError が true → isError: true', () => {
    const response: JSONRPCMessage = {
      jsonrpc: '2.0',
      id: 1,
      result: { content: [], isError: true },
    }

    expect(summarizeMcpToolCall(toolsCall('list_bikes'), response)).toEqual({
      toolName: 'list_bikes',
      isError: true,
    })
  })

  test('JSON-RPC のエラー応答 → isError: true', () => {
    const response: JSONRPCMessage = {
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32602, message: 'Tool not found' },
    }

    expect(summarizeMcpToolCall(toolsCall('unknown_tool'), response)).toEqual({
      toolName: 'unknown_tool',
      isError: true,
    })
  })

  test('tools/call 以外のリクエスト → null', () => {
    const request: JSONRPCMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    }

    expect(summarizeMcpToolCall(request, success)).toBeNull()
  })

  test('ツール名が文字列でない・空 → null', () => {
    expect(summarizeMcpToolCall(toolsCall(123), success)).toBeNull()
    expect(summarizeMcpToolCall(toolsCall(''), success)).toBeNull()
  })

  test('長すぎるツール名は100文字で切る', () => {
    const summary = summarizeMcpToolCall(toolsCall('a'.repeat(150)), success)

    expect(summary?.toolName).toHaveLength(100)
  })
})
