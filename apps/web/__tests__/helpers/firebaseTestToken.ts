import { getApps, initializeApp } from 'firebase/app'
import {
  EmailAuthProvider,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithCredential,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'

let authInstance: ReturnType<typeof getAuth> | null = null
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'

function getFirebaseApp() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  }
  const apps = getApps()
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig)
  return app
}

export function getFirebaseClientAuth() {
  if (typeof window === 'undefined' && !useEmulator) return null

  if (authInstance) return authInstance

  const app = getFirebaseApp()
  const auth = getAuth(app)

  if (useEmulator) {
    connectAuthEmulator(auth, 'http://localhost:9099', {
      disableWarnings: true,
    })
  }
  authInstance = auth

  return authInstance
}

export const handleRegisterByFirebase = async (
  email: string,
  password: string
) => {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Firebase auth is not initialized')
  return await createUserWithEmailAndPassword(auth, email, password)
}

export const handleLoginByFirebase = async (
  email: string,
  password: string
) => {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Firebase auth is not initialized')
  return await signInWithEmailAndPassword(auth, email, password)
}

export const handleAnonymousSignInByFirebase = async () => {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Firebase auth is not initialized')
  // 既存のセッションをクリアして必ず新しい匿名ユーザーを作成する
  if (auth.currentUser) {
    await signOut(auth)
  }
  return await signInAnonymously(auth)
}

export const handleLinkAnonymousWithEmail = async (
  email: string,
  password: string
) => {
  const auth = getFirebaseClientAuth()
  if (!auth) throw new Error('Firebase auth is not initialized')
  if (!auth.currentUser) throw new Error('No current user to link')
  const credential = EmailAuthProvider.credential(email, password)
  return await linkWithCredential(auth.currentUser, credential)
}
