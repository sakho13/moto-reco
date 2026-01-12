import { logEvent } from 'firebase/analytics'
import { firebaseAnalytics } from './config'

const LogEvent = {
  webLogin: 'web_login',
  webLogout: 'web_logout',
  webSignUp: 'web_sign_up',
}

export function useAnalytics() {
  return (
    eventName: keyof typeof LogEvent,
    eventParams?: Record<string, unknown>
  ) => {
    if (!firebaseAnalytics) {
      console.log(`[Firebase Analytics Debug] Event: ${eventName}`, eventParams)
      return
    }

    logEvent(firebaseAnalytics, LogEvent[eventName], eventParams)
  }
}
