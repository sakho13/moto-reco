'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * メディアクエリの一致状態を返す
 *
 * @remarks
 * サーバー描画時は `false` を返す。
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query]
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}
