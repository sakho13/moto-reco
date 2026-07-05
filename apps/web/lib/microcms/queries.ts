import type { MicroCMSQueries } from 'microcms-js-sdk'
import { microCMSClient } from './config'

/**
 * 開発環境以外では status[contains]published を必ず付与した絞り込み条件を組み立てる
 */
export function withPublishedFilter(filter?: string): string | undefined {
  if (process.env.NODE_ENV === 'development') return filter

  return filter
    ? `${filter}[and]status[contains]published`
    : 'status[contains]published'
}

/**
 * MicroCMSのリスト取得をラップし、クライアント未設定時・取得失敗時は空配列を返す
 */
export async function safeGetList<T>(
  endpoint: string,
  queries: MicroCMSQueries,
  logContext?: string
): Promise<T[]> {
  try {
    if (!microCMSClient) return []
    const data = await microCMSClient.getList<T>({ endpoint, queries })
    if (logContext) {
      console.log(`[${logContext}] 取得: ${data.contents.length}件`)
    }
    return data.contents
  } catch (error) {
    if (logContext) {
      console.error(`[${logContext}] 取得失敗`, {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
    return []
  }
}

/**
 * MicroCMSのリストから先頭1件を取得する。該当なし・取得失敗時は null を返す
 */
export async function safeGetListItem<T>(
  endpoint: string,
  queries: MicroCMSQueries
): Promise<T | null> {
  const contents = await safeGetList<T>(endpoint, { ...queries, limit: 1 })
  return contents[0] ?? null
}
