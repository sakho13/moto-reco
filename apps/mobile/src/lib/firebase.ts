import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth'
import { ENV } from './env'
import { keyValueStorage } from './keyValueStorage'

/** Firebase アプリ（Fast Refresh で二重に初期化しない） */
const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(ENV.firebase)

/**
 * Firebase Authentication
 *
 * @remarks
 * ログイン状態を端末に保存し、アプリを再起動してもログインしたままにする。
 * React Native では `getAuth()` だとメモリにしか保存されないため、
 * `initializeAuth` で保存先を指定する。
 */
export const firebaseAuth: Auth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(keyValueStorage),
})

if (ENV.useFirebaseEmulator) {
  connectAuthEmulator(firebaseAuth, ENV.firebaseAuthEmulatorUrl, {
    disableWarnings: true,
  })
}
