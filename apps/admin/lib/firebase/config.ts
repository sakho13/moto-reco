import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'

const useEmulator =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' ||
  process.env.NODE_ENV === 'development'

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    (useEmulator ? 'test-api-key' : undefined),
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    (useEmulator ? 'localhost' : undefined),
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    (useEmulator ? 'motoreco' : undefined),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    (useEmulator ? 'test-app-id' : undefined),
}

let firebaseApp: FirebaseApp
let firebaseAuth: Auth

export const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseApp && getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig)
  }
  return firebaseApp ?? getApps()[0]!
}

export const getFirebaseAuth = (): Auth => {
  if (!firebaseAuth) {
    const app = getFirebaseApp()
    firebaseAuth = getAuth(app)

    if (useEmulator && typeof window !== 'undefined') {
      connectAuthEmulator(firebaseAuth, 'http://localhost:9099', {
        disableWarnings: true,
      })
    }
  }
  return firebaseAuth
}
