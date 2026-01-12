'use client'

import { firebaseAnalytics } from '@/lib/firebase/config'

export const FirebaseAnalytics = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  firebaseAnalytics

  return <div id="firebase-analytics"></div>
}
