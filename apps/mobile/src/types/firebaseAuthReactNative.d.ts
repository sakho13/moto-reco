import type { Persistence } from 'firebase/auth'

/**
 * Firebase Auth の React Native 用ビルドにだけある関数の型
 *
 * @remarks
 * `firebase/auth` の型定義は `types` 条件が先に解決され、React Native 用の
 * `getReactNativePersistence` が含まれない。実行時は Metro が React Native 用の
 * ビルドを読み込む（`metro.config.js` を参照）ため、型だけを補う。
 */
declare module 'firebase/auth' {
  /** `getItem` / `setItem` / `removeItem` を持つ AsyncStorage 互換のストレージ */
  type ReactNativeAsyncStorage = {
    getItem(key: string): Promise<string | null>
    setItem(key: string, value: string): Promise<void>
    removeItem(key: string): Promise<void>
  }

  export function getReactNativePersistence(
    storage: ReactNativeAsyncStorage
  ): Persistence
}
