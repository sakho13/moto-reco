'use client'

import { useEffect } from 'react'
import { getFirebaseAnalytics } from '@/lib/firebase/config'

export const FirebaseAnalytics = () => {
  useEffect(() => {
    getFirebaseAnalytics()
  }, [])

  return <div id="firebase-analytics"></div>
}
