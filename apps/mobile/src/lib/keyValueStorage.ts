import Storage from 'expo-sqlite/kv-store'

/**
 * 端末に値を保存するキー・バリュー型のストレージ
 *
 * @remarks
 * AsyncStorage と同じ使い方ができる `expo-sqlite/kv-store` を使う。
 * `@react-native-async-storage/async-storage` を入れると、pnpm がワークスペース
 * 全体で Firebase のオプションの peer 依存として解決し、Web 側にも React Native が
 * 入り込むため使わない。
 */
export const keyValueStorage = Storage

/** このアプリが保存に使うキー */
export const STORAGE_KEYS = {
  /** 最後に選んだ愛車の myUserBikeId */
  ACTIVE_BIKE_ID: 'motoreco.activeBikeId',
} as const
