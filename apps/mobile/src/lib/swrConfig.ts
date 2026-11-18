import { AppState } from 'react-native'
import type { SWRConfiguration } from 'swr'

/**
 * React Native 用の SWR の設定
 *
 * @remarks
 * SWR はブラウザのタブのフォーカスで再取得するが、React Native にはその仕組みが
 * ないため、アプリが前面に戻ったとき（AppState が active になったとき）に再取得する。
 */
export const SWR_CONFIG: SWRConfiguration = {
  revalidateOnFocus: true,
  isVisible: () => AppState.currentState === 'active',
  initFocus(callback) {
    let currentState = AppState.currentState
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasInBackground =
        currentState === 'inactive' || currentState === 'background'
      if (wasInBackground && nextState === 'active') {
        callback()
      }
      currentState = nextState
    })
    return () => subscription.remove()
  },
}
