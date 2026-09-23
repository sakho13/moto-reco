'use client'

import { useContext } from 'react'
import { ActiveBikeContext } from '../contexts/ActiveBikeContext'
import type { ActiveBikeContextType } from '@/types/activeBike'

/**
 * アクティブ車両コンテキストを使用するカスタムフック
 *
 * @remarks
 * `ActiveBikeProvider`（`app/(protected)/layout.tsx` に配置）配下でのみ使用できる。
 */
export const useActiveBike = (): ActiveBikeContextType => {
  const context = useContext(ActiveBikeContext)

  if (context === undefined) {
    throw new Error('useActiveBike must be used within an ActiveBikeProvider')
  }

  return context
}
