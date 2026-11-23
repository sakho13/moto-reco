export interface IMcpToolCallLogRepository {
  /**
   * MCPツールの呼び出しを1件記録する
   *
   * @remarks
   * `clientId` は `MOAuthClient.id`（内部cuid）を指定する。
   */
  create(params: {
    userId: string
    clientId: string | null
    toolName: string
    isError: boolean
    durationMs: number
  }): Promise<void>
}
