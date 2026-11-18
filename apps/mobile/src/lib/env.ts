/**
 * アプリの設定値（環境変数）
 *
 * @remarks
 * Expo は `EXPO_PUBLIC_` で始まる環境変数をビルド時にコードへ埋め込む。
 * 埋め込みは `process.env.EXPO_PUBLIC_XXX` と書いた箇所だけに行われるため、
 * 分割代入や動的なキーでは参照しないこと。
 * 秘密にすべき値（サーバー用の鍵など）はアプリに含まれるため、ここに置かない。
 */
export const ENV = {
  /** API サーバーのURL（末尾のスラッシュなし）。実機からは開発PCのLAN IPを指定する */
  apiBaseUrl: trimTrailingSlash(
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
  ),
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },
  /** Firebase Auth Emulator を使うか */
  useFirebaseEmulator: process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true',
  /** Firebase Auth Emulator のURL。実機からは開発PCのLAN IPを指定する */
  firebaseAuthEmulatorUrl:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL ??
    'http://localhost:9099',
} as const

/** URL の末尾のスラッシュを取り除く */
export function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}
