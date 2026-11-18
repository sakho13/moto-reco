import { useContext } from 'react'
import {
  ActiveBikeContext,
  type ActiveBikeContextValue,
} from './ActiveBikeProvider'

/**
 * 愛車一覧と選択中の愛車を取得する
 *
 * @throws {Error} `ActiveBikeProvider` の外で呼んだ場合
 */
export function useActiveBike(): ActiveBikeContextValue {
  const context = useContext(ActiveBikeContext)
  if (!context) {
    throw new Error('useActiveBike は ActiveBikeProvider の中で使ってください')
  }
  return context
}
