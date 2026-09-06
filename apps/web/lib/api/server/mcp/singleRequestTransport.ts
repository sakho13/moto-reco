import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'

/**
 * stateless モード用の単発リクエストトランスポート。
 * McpServer に connect() した後、start() でリクエストを流し、
 * send() で受け取ったレスポンスを Promise で返す。
 */
export class SingleRequestTransport implements Transport {
  private readonly _input: JSONRPCMessage
  private _responsePromise: Promise<JSONRPCMessage>
  private _resolveResponse!: (msg: JSONRPCMessage) => void

  onmessage?: (message: JSONRPCMessage) => void
  onclose?: () => void
  onerror?: (error: Error) => void

  constructor(input: JSONRPCMessage) {
    this._input = input
    this._responsePromise = new Promise((resolve) => {
      this._resolveResponse = resolve
    })
  }

  async start(): Promise<void> {
    // onmessage は connect() 内で設定されてから start() が呼ばれる
    this.onmessage?.(this._input)
  }

  async close(): Promise<void> {}

  async send(message: JSONRPCMessage): Promise<void> {
    // レスポンス（id あり）のみ解決する。通知（id なし）は無視する。
    if ('id' in message) {
      this._resolveResponse(message)
    }
  }

  getResponse(): Promise<JSONRPCMessage> {
    return this._responsePromise
  }
}
