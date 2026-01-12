import { getAnalytics, type Analytics } from 'firebase/analytics'
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'

const isProduction = process.env.NODE_ENV === 'production'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let firebaseApp: FirebaseApp
let firebaseAuth: Auth
export let firebaseAnalytics: Analytics | null

/**
 * Firebase アプリケーションの初期化
 */
export const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseApp && getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig)
  }
  return firebaseApp
}

/**
 * Firebase Authentication インスタンスの取得
 */
export const getFirebaseAuth = (): Auth => {
  if (!firebaseAuth) {
    const app = getFirebaseApp()
    firebaseAuth = getAuth(app)

    // 開発環境でエミュレータを使用
    if (
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
      typeof window !== 'undefined'
    ) {
      connectAuthEmulator(firebaseAuth, 'http://localhost:9099', {
        disableWarnings: true,
      })
    }
  }
  return firebaseAuth
}

export const getFirebaseAnalytics = (): Analytics | null => {
  if (!isProduction) return null

  if (!firebaseAnalytics) {
    const app = getFirebaseApp()
    if (typeof window !== 'undefined') {
      firebaseAnalytics = getAnalytics(app)
    }
  }
  return firebaseAnalytics
}
