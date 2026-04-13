import { sendGAEvent } from '@next/third-parties/google'

export type AnalyticsEventName =
  | 'web_login'
  | 'web_logout'
  | 'web_sign_up'
  | 'web_guest_login'
  | 'web_guest_upgrade'

/**
 * Google Analyticsにカスタムイベントを送信する
 * @param eventName イベント名
 * @param eventParams イベントパラメータ
 */
export function trackEvent(
  eventName: AnalyticsEventName,
  eventParams?: Record<string, unknown>
) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Analytics Debug] ${eventName}`, eventParams)
    return
  }
  sendGAEvent('event', eventName, eventParams ?? {})
}
