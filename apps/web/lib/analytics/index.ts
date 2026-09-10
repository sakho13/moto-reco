import { sendGAEvent } from '@next/third-parties/google'

export type AnalyticsEventName =
  | 'web_login'
  | 'web_logout'
  | 'web_sign_up'
  | 'fuel_log_create'
  | 'fuel_log_update'
  | 'fuel_log_delete'
  | 'fuel_log_error'
  | 'login_error'
  | 'web_guest_login'
  | 'bike_register'
  | 'bike_update'
  | 'bike_error'
  | 'maintenance_log_create'
  | 'maintenance_log_update'
  | 'maintenance_log_error'
  | 'touring_plan_create'
  | 'touring_plan_update'
  | 'touring_plan_delete'
  | 'touring_plan_location_update'
  | 'touring_plan_spot_create'
  | 'touring_plan_spot_update'
  | 'touring_plan_spot_delete'
  | 'touring_plan_error'
  | 'touring_create'
  | 'touring_update'
  | 'touring_delete'
  | 'touring_start'
  | 'touring_end'
  | 'touring_location_update'
  | 'touring_fuel_log_link'
  | 'touring_spot_create'
  | 'touring_spot_update'
  | 'touring_spot_delete'
  | 'touring_break_start'
  | 'touring_break_end'
  | 'touring_spot_arrive'
  | 'touring_spot_skip'
  | 'touring_error'
  | 'profile_update'
  | 'profile_error'
  | 'account_quit'
  | 'account_quit_error'

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
